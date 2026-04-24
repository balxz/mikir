const { exec } = require("child_process");
const util = require("util");

module.exports = async (cmd, m, clients, args, is) => {
  switch (cmd) {
    case "ev": { // @category owner @cmd ev @desc eval
      if (!m.owner.includes(m.sender)) return m.reply("This command can only be used by the owner.")
      //console.log(is)
        let duh = m.body.slice(m.body.indexOf(cmd) + cmd.length).trim() || "return m";
        try {
          let evaled = await eval(`(async () => { ${duh} })()`);
          if (typeof evaled !== "string")
            evaled = util.inspect(evaled);
          await m.reply(evaled);
        } catch (err) {
          await m.reply(String(err));
        }
      }
      break;
  }
};