const axios = require("axios")
module.exports = async (cmd, m, clients, args, is) => {
  switch (cmd) { // @category tools @cmd iqc @desc iqc
    case "iqc": {
      let text = m.body.slice(cmd.length).trim();
      if (!text) text = m.quotedText;
      if (!text)
        return m.reply(
        "where is text?\nex: iqc something..."
      );
      let a = await axios.post(
        "https://brat.siputzx.my.id/v2/iphone-quoted",
        {
          sender: "other",
          message: text,
          imageUrl: "",
          timestamp: "21.02",
          time: "21.02",
          status: {
            carrierName: "INDOSAT OORE...",
            batteryPercentage: 88,
            signalStrength: 4,
            wifi: true
          },
          backgroundUrl: "",
          readStatus: true,
          emojiStyle: "apple"
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*"
          },
          responseType: "arraybuffer"
        }
      );

      let b = Buffer.from(a.data);

      await clients.sendMessage(
        m.chat,
        {
          image: b,
          caption: "nih"
        },
        {
          quoted: m
        }
      );
    }
      break
  }
}