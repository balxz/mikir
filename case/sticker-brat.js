const { writeExifImg } = require("../lib/exif")
const axios = require("axios")

module.exports = async (cmd, m, clients, args, is) => {
  switch (cmd) {
    case "brat": { // @category sticker @cmd brat @desc brat
      let text = m.body.slice(cmd.length).trim();
      if (!text) text = m.quotedText;
      if (!text)
        return m.reply(
        "where is text?\nex: brat something..."
      );

      let url = `https://brat.siputzx.my.id/image?text=${encodeURIComponent(text)}`;

      let res = await axios.get(url, {
        responseType: "arraybuffer"
      });

      let buffer = Buffer.from(res.data);

      let sticker = await writeExifImg(buffer, {
        packname: "My Stc",
        author: "balxzzy"
      });

      let stickerBuffer = fs.readFileSync(sticker);

      await clients.sendMessage(
        m.chat,
        {
          sticker: stickerBuffer
        },
        {
          quoted: m
        }
      );

      fs.unlinkSync(sticker);
    }
      break;
  }
};