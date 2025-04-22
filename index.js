// Tanjiro V2 Bot
// Created by Nerdk-tech
// Owner: LIBERTY




//
require('./database/config');
const {
    default: xempConnect,
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    makeInMemoryStore,
    jidDecode,
    proto,
    getAggregateVotesInPollMessage,
    makeCacheableSignalKeyStore,
    Browsers,
    MessageRetryMap
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const chalk = require('chalk');
const {
    Boom
} = require('@hapi/boom');
const fs = require('fs');
const fsPromises = fs.promises;
const axios = require('axios');
const FileType = require('file-type');
const path = require('path');
const _ = require('lodash');
const PhoneNumber = require('awesome-phonenumber');
const {
    spawn
} = require('child_process');
const {
    say
} = require('cfonts');
const moment = require('moment-timezone');
const readline = require("readline");
const yargs = require('yargs/yargs');
const NodeCache = require("node-cache");
let low;
try {
    low = require('lowdb');
} catch (e) {
    low = require('./lib/lowdb');
};
const {
    Low,
    JSONFile
} = low;
const mongoDB = require('./lib/mongoDB');
const {
    imageToWebp,
    videoToWebp,
    writeExifImg,
    writeExifVid
} = require('./lib/exif');
const {
    smsg,
    isUrl,
    generateMessageTag,
    getBuffer,
    getSizeMedia,
    fetchJson,
    sleep
} = require('./lib/myfunction');
const {
    color
} = require('./lib/color');
const usePairingCode = global.connect;
const listcolor = ['cyan', 'magenta', 'green', 'yellow', 'blue'];
const randomcolor = listcolor[Math.floor(Math.random() * listcolor.length)];
const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(color(text, randomcolor), (answer) => {
            resolve(answer);
            rl.close();
        });
    });
};
async function xempStart() {
    const store = makeInMemoryStore({
        logger: pino().child({
            level: 'silent',
            stream: 'store'
        })
    });
    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(`./${global.sessionName}`);
    const {
        version,
        isLatest
    } = await fetchLatestBaileysVersion();
    const resolveMsgBuffer = new NodeCache();
    //const connectionOptions = {
    const xemp = xempConnect({
        isLatest,
        version: version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
        logger: pino({
            level: "fatal"
        }),
        auth: {
            creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
        },
        browser: Browsers.macOS("Chrome"),
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        connectTimeoutMs: 0,
        defaultQueryTimeoutMs: undefined,
        MessageRetryMap,
        resolveMsgBuffer,
        patchMessageBeforeSending: async (message) => {
            const requiresPatch = !!(message.buttonsMessage || message.listMessage || message.templateMessage);
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }
            return message
        },
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id, undefined);
                return msg?.message;
            }
            return {
                conversation: "hi, i'm Emperor"
            };
        }
    });
    //}
    //const xemp = makeWASocket(connectionOptions);
    if (usePairingCode && !xemp.authState.creds.registered) {
        say("virus V2\n", {
            font: 'block',
            align: 'center',
            gradient: [randomcolor, randomcolor]
        });
        say("Created By LIBERTY\n TANJIRO-VIRUS-V2\nDEADLIEST\nTHE NEW ERA\n", {
            font: 'console',
            align: 'center',
            gradient: [randomcolor, randomcolor]
        });
        let phoneNumber = await question(`<!> ENTER PHONE NUMBER BEGINNING WITH COUNTRY CODE (DO NOT USE0). ❌\n<✓> EXAMPLE : 2347041620617\n\n <+> 𝖓𝖚𝖒𝖇𝖊𝖗 : `);
        let togel = phoneNumber.replace(/[^0-9]/g, '')
        await console.clear()
        let pairCode = await xemp.requestPairingCode(togel.trim());
        console.log(color(`[ # ] enter that code into WhatsApp: ${pairCode}`, randomcolor));
    };
    
    setInterval(async () => {
        try {
            let sessionPath = path.join(__dirname, global.sessionName);
            let files = await fsPromises.readdir(sessionPath);
            let tasks = files.filter(file => file !== 'creds.json').map(async (file) => {
                let filePath = path.join(sessionPath, file);
                //By Mas`Rens
                let stat = await fsPromises.stat(filePath);
                let now = new Date();
                let fileAgeInSeconds = (now - new Date(stat.mtime)) / 1000;
                if (fileAgeInSeconds > 60) {
                    await fsPromises.unlink(filePath);
                }
            });
            await Promise.all(tasks);
            //console.error('Succes Clear Session');
        } catch (error) {
            //console.error('Error while deleting files:', error);
        }
    }, 25000); //Check Every 25 Second
    
    global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
    global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : /mongodb/.test(opts['db']) ? new mongoDB(opts['db']) : new JSONFile(`./database/database.json`));
    global.DATABASE = global.db;
    global.loadDatabase = async function loadDatabase() {
        if (global.db.READ) return new Promise((resolve) => setInterval(function() {
            if (!global.db.READ) {
                clearInterval(this);
                resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
            }
        }, 1 * 1000));
        if (global.db.data !== null) return;
        global.db.READ = true;
        await global.db.read();
        global.db.READ = false;
        global.db.data = {
            users: {},
            chats: {},
            game: {},
            database: {},
            settings: {},
            setting: {},
            others: {},
            sticker: {},
            ...(global.db.data || {})
        };
        global.db.chain = _.chain(global.db.data);
    };
    loadDatabase();
    
    if (global.db) setInterval(async () => {
        if (global.db.data) await global.db.write();
    }, 30 * 1000);
    
    xemp.public = true
    
    xemp.ev.on('connection.update', async (update) => {
        const {
            connection,
            lastDisconnect
        } = update;
        try {
            if (connection === 'close') {
                let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                if (reason === DisconnectReason.badSession) {
                    console.log("Bad Session File, Please Delete Session and Scan Again");
                    process.exit();;
                } else if (reason === DisconnectReason.connectionClosed) {
                    console.log("Connection closed, reconnecting....");
                    xempStart();
                } else if (reason === DisconnectReason.connectionLost) {
                    console.log("Connection Lost from Server, reconnecting...");
                    xempStart();
                } else if (reason === DisconnectReason.connectionReplaced) {
                    console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
                    exec('node ' + process.argv[1]);
                } else if (reason === DisconnectReason.loggedOut) {
                    console.log("Device Logged Out, Please Scan Again And Run.");
                    process.exit();
                    xempStart();
                } else if (reason === DisconnectReason.restartRequired) {
                    console.log("Restart Required, Restarting...");
                    xempStart();
                } else if (reason === DisconnectReason.timedOut) {
                    console.log("Connection TimedOut, Reconnecting...");
                    xempStart();
                } else {
                    xemp.end(`Unknown DisconnectReason: ${reason}|${connection}`);
                }
            }
            if (update.connection === "connecting" || update.receivedPendingNotifications === "false") {
            }
            if (update.connection === "open" || update.receivedPendingNotifications === "true") {
            let teksnotif = `🪀\`TANJIRO-VIRUS-V2 SUCCESFULLY CONNECTED ${xemp.user.id.split(":")[0]}\`
❗?AM BACK FOR ROUND 2 💀READY TO PROTECT MY OWNER AND ELIMINATE HIS VICTIMS BEWARE OF KILLER-VIRUS-V2 BY D@¥ID 👻 SUPPORT US BY FOLLOWING OUR CHANNEL FOR MORE UPDATES:https://whatsapp.com/channel/0029VabAgzO5Ejy5rD9exU2F`;
            xemp.sendMessage("639544106270@s.whatsapp.net", { text: teksnotif });
                await console.clear()
                await console.log(color(`<℅> Connect !!!`, `${randomcolor}`))
                await console.log(color("\nCreated By D@¥id\nYOUTUBE : unknown\nTelegram : unknown\nInstagram : unknown\n", `${randomcolor}`))
            }
        } catch (err) {
            console.log('Error In Connection.update ' + err);
            xempStart();
        }
    });
    
    xemp.ev.on('messages.update', async (chatUpdate) => {
        for (const {
                key,
                update
            }
            of chatUpdate) {
            if (update.pollUpdates && key.fromMe) {
                const pollCreation = await getMessage(key);
                if (pollCreation) {
                    const pollUpdate = await getAggregateVotesInPollMessage({
                        message: pollCreation,
                        pollUpdates: update.pollUpdates,
                    });
                    var toCmd = pollUpdate.filter(v => v.voters.length !== 0)[0]?.name;
                    if (toCmd == undefined) return;
                    var prefCmd = prefix + toCmd;
                    xemp.appendTextMessage(prefCmd, chatUpdate);
                }
            }
        }
    });
    
    xemp.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
        } else return jid;
    };
    
    xemp.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = xemp.decodeJid(contact.id);
            if (store && store.contacts) store.contacts[id] = {
                id,
                name: contact.notify
            };
        }
    });
    
    xemp.setStatus = (status) => {
        xemp.query({
            tag: 'iq',
            attrs: {
                to: '@s.whatsapp.net',
                type: 'set',
                xmlns: 'status',
            },
            content: [{
                tag: 'status',
                attrs: {},
                content: Buffer.from(status, 'utf-8')
            }]
        });
        return status;
    };
    xemp.ev.on("messages.upsert", async (chatUpdate) => {
    //console.log(JSON.stringify(chatUpdate, undefined, 2))
    try {
    mek = chatUpdate.messages[0];
      if (autoviewstatus === 'TRUE' && mek.key && mek.key.remoteJid === "status@broadcast") {

         xemp.readMessages([mek.key]);

}
      mek = chatUpdate.messages[0];
      if (!mek.message) return;
      mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;
      if (mek.key && mek.key.remoteJid === "status@broadcast") return;
      if (!xemp.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
      if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;
      m = smsg(xemp, mek, store);
    } catch (err) {
      console.log(err);
    }
  })
    xemp.getName = (jid, withoutContact = false) => {
        let id = xemp.decodeJid(jid);
        withoutContact = xemp.withoutContact || withoutContact;
        let v;
        if (id.endsWith("@g.us")) {
            return new Promise(async (resolve) => {
                v = store.contacts[id] || {};
                if (!(v.name || v.subject)) v = await xemp.groupMetadata(id) || {};
                resolve(v.name || v.subject || PhoneNumber(`+${id.replace('@s.whatsapp.net', '')}`).getNumber('international'));
            });
        } else {
            v = id === '0@s.whatsapp.net' ? {
                id,
                name: 'WhatsApp'
            } : id === xemp.decodeJid(xemp.user.id) ? xemp.user : (store.contacts[id] || {});
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber(`+${jid.replace('@s.whatsapp.net', '')}`).getNumber('international');
        }
    };
    
    xemp.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        let list = [];
        for (let i of kon) {
            list.push({
                displayName: await xemp.getName(i),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await xemp.getName(i)}\nFN:${await xemp.getName(i)}\nitem1.TEL;waid=${i.split('@')[0]}:${i.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
            });
        }
        xemp.sendMessage(jid, {
            contacts: {
                displayName: `${list.length} Kontak`,
                contacts: list
            },
            ...opts
        }, {
            quoted
        });
    };
    
    xemp.serializeM = (m) => smsg(xemp, m, store);
    xemp.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
        let mime = '';
        let res = await axios.head(url);
        mime = res.headers['content-type'];
        if (mime.split("/")[1] === "gif") {
            return xemp.sendMessage(jid, {
                video: await getBuffer(url),
                caption: caption,
                gifPlayback: true,
                ...options
            }, {
                quoted: quoted,
                ...options
            });
        }
        let type = mime.split("/")[0] + "Message";
        if (mime === "application/pdf") {
            return xemp.sendMessage(jid, {
                document: await getBuffer(url),
                mimetype: 'application/pdf',
                caption: caption,
                ...options
            }, {
                quoted: quoted,
                ...options
            });
        }
        if (mime.split("/")[0] === "image") {
            return xemp.sendMessage(jid, {
                image: await getBuffer(url),
                caption: caption,
                ...options
            }, {
                quoted: quoted,
                ...options
            });
        }
        if (mime.split("/")[0] === "video") {
            return xemp.sendMessage(jid, {
                video: await getBuffer(url),
                caption: caption,
                mimetype: 'video/mp4',
                ...options
            }, {
                quoted: quoted,
                ...options
            });
        }
        if (mime.split("/")[0] === "audio") {
            return xemp.sendMessage(jid, {
                audio: await getBuffer(url),
                caption: caption,
                mimetype: 'audio/mpeg',
                ...options
            }, {
                quoted: quoted,
                ...options
            });
        }
    };
    
    xemp.sendPoll = (jid, name = '', values = [], selectableCount = 1) => {
        return xemp.sendMessage(jid, {
            poll: {
                name,
                values,
                selectableCount
            }
        });
    }
    ;
    xemp.sendText = (jid, text, quoted = '', options) => xemp.sendMessage(jid, {
        text: text,
        ...options
    }, {
        quoted,
        ...options
    });
    
    xemp.sendImage = async (jid, path, caption = '', quoted = '', options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        return await xemp.sendMessage(jid, {
            image: buffer,
            caption: caption,
            ...options
        }, {
            quoted
        });
    };
    
    xemp.sendVideo = async (jid, path, caption = '', quoted = '', gif = false, options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        return await xemp.sendMessage(jid, {
            video: buffer,
            caption: caption,
            gifPlayback: gif,
            ...options
        }, {
            quoted
        });
    };
    
    xemp.sendAudio = async (jid, path, quoted = '', ptt = false, options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        return await xemp.sendMessage(jid, {
            audio: buffer,
            ptt: ptt,
            ...options
        }, {
            quoted
        });
    };
    
    xemp.sendTextWithMentions = async (jid, text, quoted, options = {}) => {
        return xemp.sendMessage(jid, {
            text: text,
            mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'),
            ...options
        }, {
            quoted
        });
    };
    
    xemp.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options);
        } else {
            buffer = await imageToWebp(buff);
        }
        await xemp.sendMessage(jid, {
            sticker: {
                url: buffer
            },
            ...options
        }, {
            quoted
        });
        return buffer;
    };
    
    xemp.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options);
        } else {
            buffer = await videoToWebp(buff);
        }
        await xemp.sendMessage(jid, {
            sticker: {
                url: buffer
            },
            ...options
        }, {
            quoted
        });
        return buffer;
    };
    
    xemp.downloadAndSaveMediaMessage = async (message
