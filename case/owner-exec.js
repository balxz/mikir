const { exec } = require("child_process");
const util = require("util");

module.exports = async (cmd, m, clients, args, is) => {
  switch (cmd) { // @category owner @cmd exc @desc exec
    case "exc": {
      try {
        if (!m.owner.includes(m.sender)) return m.reply("This command can only be used by the owner.");
        let code = m.body.slice(cmd.length).trim();
        if (!code) return;
        exec(code, (err, stdout, stderr) => {
          let res = stdout || stderr || err;
          if (typeof res !== "string") {
            res = util.inspect(res);
          }
          m.reply(res);
        });
      } catch (err) {
        await m.reply(String(err));
      }
      break;
    }
  }
};