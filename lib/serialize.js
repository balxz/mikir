require("../core");

exports.clientsConfig = async (opsi, store) => {
    let clients = bail.makeWASocket(opsi);
    clients.chats = {};

    clients.decodeJid = jid => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = bail.jidDecode(jid) || {};
            return decode.user && decode.server
                ? decode.user + "@" + decode.server
                : jid;
        } else return jid;
    };

    clients.ev.on("group-participants.update", async ({ id }) => {
        if (!id || id === "status@broadcast") return;
        try {
            clients.chats[id] = await clients.groupMetadata(id);
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
            console.error(`${id} — ${e}`);
        }
    });

    clients.ev.on("groups.update", async updates => {
        for (let update of updates) {
            let id = update.id;
            if (!id || id === "status@broadcast" || !id.endsWith("@g.us"))
                continue;
            try {
                clients.chats[id] = await clients.groupMetadata(id);
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                console.error(`${id} — ${err}`);
            }
        }
    });

    clients.ev.on("call", async sihama => {
        if (!set.anticall) return;
        for (let hama of sihama) {
            if (!hama.isGroup && hama.status == "offer") {
                await clients.rejectCall(hama.id, hama.from);
                await clients.sendMessage(
                    hama.from,
                    {
                        text: "*Hallo.*\n_pengguna saat ini tidak dapat menerima telefon._\n_silahkan tinggalkan pesan penting anda._"
                    },
                    {}
                );
                if (set.block)
                    await clients.updateBlockStatus(hama.from, "block");
                await bail.bail.delay(3000);
            }
        }
    });

    clients.getJid = sender => {
        if (!clients.isLid) clients.isLid = {};
        if (clients.isLid[sender]) return clients.isLid[sender];
        if (!sender.endsWith("@lid")) return sender;

        for (const chat of Object.values(clients.chats)) {
            if (!chat?.participants) continue;
            let user = chat.participants.find(
                p => p.lid === sender || p.id === sender
            );
            if (user) {
                clients.isLid[sender] = user?.phoneNumber || user?.id;
                return clients.isLid[sender];
            }
        }

        return sender;
    };

    clients.reply = async (jid, text, options = {}) => {
        if (typeof text === "string") {
            await clients.sendMessage(
                jid,
                {
                    text,
                    mentions: [m.sender],
                    contextInfo: {
                        mentionedJid: [jid]
                    },
                    ...options
                },
                {
                    ...options
                }
            );
        } else if (typeof text === "object" && typeof text !== "string") {
            await clients.sendMessage(
                jid,
                {
                    ...text,
                    mentions: [m.sender],
                    ...options
                },
                {
                    ...options
                }
            );
        }
    };
    clients.react = async (jid, emoji, k) => {
        await clients.sendMessage(jid, {
            react: {
                text: emoji,
                key: k
            }
        });
    };

    clients.sendGroupStory = async (jid, opsi) => {
        let waMsgContent;
        let messageType = bail.getContentType(opsi);
        if (opsi.message) {
            waMsgContent = opsi;
        } else {
            waMsgContent = await buildMessageContent(opsi, {
                upload: clients.waUploadToServer
            });
        }
        let msg = {
            message: {
                groupStatusMessageV2: {
                    message: waMsgContent.message || waMsgContent
                }
            }
        };

        return await clients.relayMessage(jid, msg.message, {
            messageId: bail.generateMessageID()
        });
    };

    Object.defineProperty(clients, "name", {
        value: "WASocket",
        configurable: true
    });
    return clients;
};

exports.smsg = async (clients, m, store) => {
    if (!m) return m;
    let M = bail.proto.WebMessageInfo;

    if (m.key) {
        m.id = m.key.id;
        m.from = m.key.remoteJid.startsWith("status")
            ? bail.jidNormalizedUser(m.key?.participant || m.participant)
            : bail.jidNormalizedUser(m.key.remoteJid);
        m.isBaileys = m.id.startsWith("3EB0");
        m.chat = clients.getJid(bail.jidNormalizedUser(m.key.remoteJid));
        //m.owner = owner[0] + "@s.whatsapp.net";
        m.owner = owner.map(v => v + "@s.whatsapp.net");
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith("@g.us");
        m.sender = clients.getJid(
            bail.jidNormalizedUser(
                m.key.participantAlt ||
                    m.key.participantPn ||
                    m.key.participant ||
                    m.chat
            )
        );
    }

    if (m.message) {
        let cht = clients.chats[m.key.remoteJid] || {};
        let parti = (cht?.participants || []).reduce((acc, p) => {
            acc[p.id] = p.phoneNumber;
            return acc;
        }, {});

        m.mtype = bail.getContentType(m.message);
        m.msg =
            m.mtype == "viewOnceMessage"
                ? m.message[m.mtype].message[
                      bail.getContentType(m.message[m.mtype].message)
                  ]
                : m.message[m.mtype];

        m.body = m.message.conversation || m.msg?.text || m?.text;
        let quoted = (m.quoted = m.msg?.contextInfo?.quotedMessage || null);

        m.mentionedJid = m.isGroup
            ? (m.msg?.contextInfo?.mentionedJid || [])
                  .map(id => parti[id] || id)
                  .filter(Boolean)
            : [];

        if (m.quoted) {
            let type = bail.getContentType(quoted);
            m.quoted = m.quoted[type];
            if (["productMessage"].includes(type)) {
                type = bail.getContentType(m.quoted);
                m.quoted = m.quoted[type];
            }
            if (typeof m.quoted === "string")
                m.quoted = {
                    text: m.quoted
                };

            if (m && m.quoted) {
                m.quoted.key = {
                    remoteJid: m.msg?.contextInfo?.remoteJid || m.from,
                    participant: bail.jidNormalizedUser(
                        m.msg?.contextInfo?.participant
                    ),
                    fromMe: bail.areJidsSameUser(
                        bail.jidNormalizedUser(m.msg?.contextInfo?.participant),
                        bail.jidNormalizedUser(clients?.user?.id)
                    ),
                    id: m.msg?.contextInfo?.stanzaId
                };
            }
            if (m.quoted) m.quoted.mtype = type;
            if (m.quoted && m.quoted.key) {
                m.quoted.from = /g\.us|status/.test(
                    m.msg?.contextInfo?.remoteJid
                )
                    ? m.quoted.key.participant
                    : m.quoted.key.remoteJid;
                m.quoted.id = m.msg?.contextInfo?.stanzaId;
                m.quoted.chat = m.msg?.contextInfo?.remoteJid || m.chat;

                if (m.quoted.id) {
                    m.quoted.isBaileys = m.quoted.id.startsWith("3EB0");
                }

                m.quoted.sender = clients.decodeJid(
                    m.msg?.contextInfo?.participant
                );
                m.quoted.fromMe = m.quoted.sender === clients.user?.id;
                m.quoted.text =
                    m.quoted.text ||
                    m.quoted.caption ||
                    m.quoted.conversation ||
                    m.quoted.contentText ||
                    m.quoted.selectedDisplayText ||
                    m.quoted.title ||
                    "";
                m.quoted.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];
                m.getQuotedObj = m.getQuotedMessage = async () => {
                    if (!m.quoted.id) return false;
                    let q = await store.loadMessage(
                        m.chat,
                        m.quoted.id,
                        clients
                    );
                    return exports.smsg(clients, q, store);
                };
                m.quoted.fakeObj = M.fromObject({
                    key: {
                        remoteJid: m.quoted.chat,
                        fromMe: m.quoted.fromMe,
                        id: m.quoted.id
                    },
                    message: quoted,
                    ...(m.isGroup
                        ? {
                              participant: m.quoted.sender
                          }
                        : {})
                });

                m.quoted.download = () => downloadMediaMessage(m.quoted);
            }
        }
    }

    m.reply = async (text, options = {}) => {
        if (typeof text !== "string") text = String(text || "");
        return clients.sendMessage(
            m.chat,
            {
                text,
                mentions: [m.sender],
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true
                },
                ...options
            },
            {
                quoted: m,
                ephemeralExpiration: m.expiration,
                ...options
            }
        );
    };

    m.copy = () => exports.smsg(clients, M.fromObject(M.toObject(m)));

    m.react = (e, key = m.key) => {
        clients.sendMessage(m.chat, {
            react: {
                text: e,
                key: key
            }
        });
    };

    return m;
};

async function downloadMediaMessage(message) {
    let mime = (message.msg || message).mimetype || "";
    let messageType = message.mtype
        ? message.mtype.replace(/Message/gi, "")
        : mime.split("/")[0];
    const stream = await bail.downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    for await (let chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

async function buildMessageContent(content, opts = {}) {
    try {
        if (typeof bail.generateWAMessageContent === "function") {
            return await bail.generateWAMessageContent(content, opts);
        }

        if (typeof clients?.generateWAMessageContent === "function") {
            return await clients.generateWAMessageContent(content, opts);
        }

        if (typeof clients?.prepareMessageContent === "function") {
            return await clients.prepareMessageContent(content, opts);
        }

        const { generateWAMessageContent } = require("baileys");
        return await generateWAMessageContent(content, opts);
    } catch (e) {
        console.error(e);
    }
}
