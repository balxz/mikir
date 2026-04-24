module.exports = async (cmd, m, clients, args, is) => {
  switch (cmd) {
    case "rt": { // @category info @cmd rt @desc runtime
      let uptime = (Date.now() - start) / 1000;
      m.reply(formatRuntime(uptime));
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