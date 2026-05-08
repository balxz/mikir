module.exports = function(m, clients) {
  console.log(`乂 L O G S  -  C H A T S\n${new Date()}\n◦ jid: ${m.key.participant || m.key.remoteJid}\n◦ nme: ${m.pushName}\n◦ cht: ${m.chat}\n◦ gc: ${m.isGroup ? clients.chats[m.chat].subject: "pv"}\n${m.body?.trim() || ""}\n${"──".repeat(20)}`);
};