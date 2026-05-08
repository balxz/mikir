module.exports = async (cmd, m, clients, args, is) => {
  switch (cmd) {
    case "rt": { // @category info @cmd rt @desc runtime
      await m.react("🕓")
      let uptime = (Date.now() - start) / 1000;
      m.reply(`乂 *R U N T I M E  -  B O T*\n> _${formatRuntime(uptime)}_`);
      await m.react("")
    }
      break;
  }
};

function formatRuntime(sec) {
  let d = Math.floor(sec / 86400);
  let h = Math.floor((sec % 86400) / 3600);
  let m = Math.floor((sec % 3600) / 60);
  let s = Math.floor(sec % 60);

  return [d && d + "d",
    h && h + "h",
    m && m + "m",
    s && s + "s"]
  .filter(Boolean)
  .join(" ");
}