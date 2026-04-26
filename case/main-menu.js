const fs = require("node:fs");
const path = require("node:path");

module.exports = async (cmd, m, clients, args, is) => {
  switch (cmd) { // @category main @cmd menu @desc show fiture
    case "anus": {
      let a = Object.entries(
        fs.readdirSync(path.join(process.cwd(), "case"))
          .filter(f => f.endsWith(".js"))
          .flatMap(file =>
            fs.readFileSync(path.join(process.cwd(), "case", file), "utf8")
              .split("\n")
              .map(l => [...l.matchAll(/@(\w+)\s+([^@]+)/g)])
              .filter(m => m.length)
              .map(m => Object.fromEntries(m.map(([, k, v]) => [k.toLowerCase(), v.trim()])))
              .filter(o => o.category && o.cmd)
          )
          .reduce((a, o) => {
            (a[o.category] ||= []).push({ cmd: o.cmd, desc: o.desc || "" });
            return a;
          }, {})
      )
        .map(([cat, items]) =>
          `╭  _*${cat.toUpperCase()}*_\n` +
          items.map(i => `│  ∘ ${i.cmd} (${i.desc})`).join("\n") +
          `\n╰⊶`
        )
        .join("\n");

      await m.reply(
        `Hi, @${m.sender.split("@")[0]} im, a shiina whatsapp bot designed for virtual assistant, you can download various social media or create sticker, play games so yoy don't get bored. if you want to increase premium or rent a bot, please contact customer support, to contact customer support, please use *.owner*\n\n${a}\n\n> _${new Date()}_`,
        {
          mentions: [m.sender],
          contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
            mentionedJid: [m.sender],
            externalAdReply: {
              title: "SHIINA - WABOT",
              body: "ხαاxzzy",
              mediaType: 1,
              renderLargerThumbnail: true,
              thumbnailUrl: "https://raw.githubusercontent.com/balxz/akuuu-muaakk/refs/heads/main/banner.jpeg",
              sourceUrl: "https://wa.me/" + m.sender.split("@")[0] +"?text=gw+hewan"
            }
          }
        }
      );
    }
    break;
  }
};