require("./core")

const { clientsConfig, smsg } = require("./lib/serialize")
const { Boom } = require("@hapi/boom")
const pino = require("pino")
const path = require("node:path")
const fs = require("fs")

async function startBot() {
    let { state, saveCreds } = await bail.useMultiFileAuthState(bot.sesi)

    global.clients = await clientsConfig({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        version: [2, 3000, 1033846690],
        browser: ["Linux", "Chrome", ""],
        auth: state,
        generateHighQualityLinkPreview: true
    })

    if (!clients.authState.creds.registered) {
        let phoneNumber = bot.pair
        setTimeout(async () => {
            let code = await clients.requestPairingCode(phoneNumber)
            console.log(code.match(/.{1,4}/g).join("-"))
        }, 3000)
    }

    clients.ev.on("connection.update", async update => {
        let { connection, lastDisconnect } = update
        if (connection === "close") {
            let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            if (reason !== bail.DisconnectReason.loggedOut) {
                setTimeout(startBot, 5000)
            }
        } else if (connection === "open") {
            let gcny = (await clients.groupFetchAllParticipating().catch(() => ({}))) || {}
            for (let id in gcny) {
                clients.chats[id] = gcny[id]
            }
            console.log("CONNECTED")
        }
    })

    clients.ev.on("creds.update", saveCreds)

    fs.watch(path.join(__dirname, "case"), (event, filename) => {
        if (!filename.endsWith(".js")) return
        let file = path.join(__dirname, "case", filename)
        delete require.cache[require.resolve(file)]
    })

    clients.ev.on("messages.upsert", async ({ messages }) => {
        try {
            clients.messages ??= new Map();
            let m = await smsg(clients, messages[0])
            if (!clients.messages.has(m.chat)) clients.messages.set(m.chat, []);
            clients.messages.get(m.chat).push(m);
            global.is = await require("./lib/prehandler").is(m, clients)

            console.log(
                `${m.key.participant || m.key.remoteJid} -> ${m.chat}\n${m.body?.trim() || ""}\n${"──".repeat(20)}`
            );

            if (!m.body) return
            let prefix = ""
            if (!m.body.startsWith(prefix)) return

            let args = m.body.slice(prefix.length).trim().split(/ +/)
            let cmd = args.shift().toLowerCase()

            let files = fs
                .readdirSync(path.join(__dirname, "case"))
                .filter(file => file.endsWith(".js"))

            for (let file of files) {
                let a = path.join(__dirname, "case", file)
                try {
                    delete require.cache[require.resolve(a)]
                    let b = require(a)
                    if (typeof b !== "function") continue
                    await b(cmd, m, clients, args, is)
                } catch (e) {
                    console.log(e)
                }
            }
        } catch (err) {
            console.log(err)
        }
    })
}

startBot()