let axios = require("axios")
let nexray = require("api-nexray")
let yts = require("yt-search")
let ffmpeg = require("fluent-ffmpeg")
let { PassThrough } = require("stream")

module.exports = async (cmd, m, clients, args, is) => {
  switch (cmd) {
    case "ytmp3": case "play": { // @category downloader @cmd ytmp3 @desc youtube music

      let q = args.join(" ").trim()
      if (!q) return m.reply(`where url / query?\n> example: .ytmp3 https://youtube.com/watch?v=xxxx\n> example: .ytmp3 song name`)

      let isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(q)
      let url = q

      try {
        if (!isUrl) {
          let res = await yts(q)
          await clients.sendMessage(m.chat, {
            react: { text: "🕓", key: m.key }
          })
          let video = res.all.find(v => v.type === "video")
          if (!video) return m.reply("video not found.\n> _try again next time._")
          url = video.url
        }

        let res = await nexray.get("/downloader/v1/ytmp3", {
          url
        })

        if (!res.status || !res.result) return m.reply("audio not found.\n> _try again next time._")

        let data = res.result

        let file = await axios.get(data.url, {
          responseType: "arraybuffer",
          headers: { Range: "bytes=0-" }
        })

        let buff = file.data

        let toOpus = buffer =>
          new Promise((resolve, reject) => {
            let input = new PassThrough()
            let output = new PassThrough()
            let chunks = []
            input.end(buffer)
            ffmpeg(input)
              .noVideo()
              .audioCodec("libopus")
              .format("ogg")
              .audioBitrate("48k")
              .audioChannels(1)
              .audioFrequency(48000)
              .outputOptions([
                "-vn",
                "-b:a 64k",
                "-ac 2",
                "-ar 48000",
                "-map_metadata",
                "-1",
                "-application",
                "voip"
              ])
              .on("error", reject)
              .on("end", () => resolve(Buffer.concat(chunks)))
              .pipe(output, { end: true })

            output.on("data", c => chunks.push(c))
          })

        let makeWaveform = buffer =>
          new Promise((resolve, reject) => {
            let input = new PassThrough()
            input.end(buffer)
            let chunks = []
            let bars = 64
            ffmpeg(input)
              .audioChannels(1)
              .audioFrequency(16000)
              .format("s16le")
              .on("error", reject)
              .on("end", () => {
                let raw = Buffer.concat(chunks)
                let samples = raw.length / 2
                let amps = []
                for (let i = 0; i < samples; i++) {
                  amps.push(Math.abs(raw.readInt16LE(i * 2)) / 32768)
                }
                let block = Math.floor(amps.length / bars)
                let avg = []
                for (let i = 0; i < bars; i++) {
                  let a = amps.slice(i * block, (i + 1) * block)
                  avg.push(a.reduce((x, y) => x + y, 0) / a.length)
                }
                let max = Math.max(...avg)
                let normalized = avg.map(v => Math.floor((v / max) * 100))
                resolve(Buffer.from(new Uint8Array(normalized)).toString("base64"))
              })
              .pipe()
              .on("data", c => chunks.push(c))
          })

        let opus = await toOpus(buff)
        let waveform = await makeWaveform(buff)

        await clients.sendMessage(m.chat, {
          audio: opus,
          mimetype: "audio/ogg; codecs=opus",
          ptt: true,
          waveform,
          contextInfo: {
            externalAdReply: {
              title: data.title,
              body: `${data.author} • ${data.quality}`,
              thumbnailUrl: data.thumbnail,
              mediaType: 1,
              renderLargerThumbnail: true,
              sourceUrl: url
            }
          }
        }, { quoted: m })

      } catch (e) {
        m.reply("failed to fetch audio.\n> _try again next time._")
      }

    }
    break;
  }
}