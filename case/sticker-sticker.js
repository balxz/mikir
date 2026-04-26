const {
  downloadContentFromMessage
} = require("baileys")
const {
  videoToWebp,
  writeExif,
  writeExifVid,
  writeExifImg
} = require("../lib/exif")
module.exports = async (cmd, m, clients, args, is) => {
  switch (cmd) { // @category sticker @cmd s @desc sticker
    case "sticker": case "s": {
      let quoted =
      m.message?.extendedTextMessage?.contextInfo
      ?.quotedMessage;
      let type = quoted ? Object.keys(quoted)[0]: m.mtype;
      let media = quoted ? quoted[type]: m.message[type];

      if (!type) return m.reply("reply image/video/sticker");
      if (!/image|video|sticker/.test(type))
        return m.reply("reply image/video/sticker");
      if (!media || (!media.url && !media.directPath))
        return m.reply("reply image/video/sticker");

      let stream = await downloadContentFromMessage(
        media,
        type.replace("Message", "")
      );

      let buffer = Buffer.from([]);
      for await (let chunk of stream)
      buffer = Buffer.concat([buffer, chunk]);

      let result;

      if (/image/.test(type))
        result = await writeExifImg(buffer, {
        packname: "My stc",
        author: "balxzzy"
      });
      else if (/video/.test(type))
        result = await writeExifVid(buffer, {
        packname: "My stc",
        author: "balxzzy"
      });
      else if (/sticker/.test(type))
        result = await writeExif(
        {
          mimetype: "image/webp", data: buffer
        },
        {
          packname: "My stc", author: "balxzzy"
        }
      );

      let stickerBuffer = fs.readFileSync(result);
      await clients.sendMessage(
        m.chat,
        {
          sticker: stickerBuffer
        },
        {
          quoted: m
        }
      );
      fs.unlinkSync(result);
    }
      break
  }
}