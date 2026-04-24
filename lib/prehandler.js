class Access {
  static async is(m, clients) {
    if (!m.message) return
    let bbi = m.isGroup && clients.chats && clients.chats[m.chat]

    return {
      owner: m.owner.includes(m.sender), // own
      group: m.isGroup, // gc
      private: !m.isGroup, // pv
      admin: m.isGroup ? bbi?.participants?.some(v => v.admin && v.jid === m.sender) : false, // adm
      botadmin: m.isGroup ? bbi?.participants?.some(v => v.admin && v.jid === clients.decodeJid(clients.user.id.split(":")[0] + "@s.whatsapp.net")) : false // bot adm
    }
  }
}

module.exports = Access