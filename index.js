// Tanjiro V2 Bot
// Created by Nerdk-tech
// Owner: LIBERTY
require('./settings');
const {
	default: makeWASocket,
	DisconnectReason,
	useMultiFileAuthState,
	fetchLatestBaileysVersion,
	makeInMemoryStore,
	jidDecode
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const chalk = require('chalk');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const readline = require('readline');
const figlet = require('figlet');
const { smsg } = require('./lib/myfunc');
const NodeCache = require("node-cache");
const msgRetryCounterCache = new NodeCache();
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const question = (text) => {
	return new Promise((resolve) => {
		rl.question(text, (answer) => {
			resolve(answer);
		});
	});
};

const connectToWhatsApp = async () => {
	const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
	const { version, isLatest } = await fetchLatestBaileysVersion();

	console.log(chalk.green(`Using: WA v${version.join('.')}, isLatest: ${isLatest}`));

	const sock = makeWASocket({
		version,
		logger: pino({ level: 'silent' }),
		printQRInTerminal: true,
		auth: state,
		msgRetryCounterCache,
		browser: ['TANJIRO BOT', 'Safari', '1.0.0'],
		generateHighQualityLinkPreview: true
	});

	store.bind(sock.ev);

	sock.ev.on('messages.upsert', async (m) => {
		try {
			const msg = m.messages[0];
			if (!msg.message) return;
			if (msg.key && msg.key.remoteJid === 'status@broadcast') return;

			msg.message = (Object.keys(msg.message)[0] === 'ephemeralMessage') ?
				msg.message.ephemeralMessage.message :
				msg.message;

			const from = msg.key.remoteJid;
			const isGroup = from.endsWith('@g.us');
			const sender = isGroup ? msg.key.participant : msg.key.remoteJid;

			smsg(sock, msg);

			if (msg.body === undefined) return;
			console.log(chalk.green("MESSAGE:"), msg.body);

			if (msg.body.startsWith('!ping')) {
				await sock.sendMessage(from, { text: 'Pong!' });
			}
		} catch (err) {
			console.error('Error in message handler:', err);
		}
	});

	sock.ev.on('connection.update', async (update) => {
		const { connection, lastDisconnect } = update;

		if (connection === 'close') {
			const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
			console.log(chalk.red(`Connection closed. Reconnecting: ${shouldReconnect}`));

			if (shouldReconnect) {
				connectToWhatsApp();
			}
		} else if (connection === 'open') {
			console.log(chalk.green("Bot is now connected!"));
		}
	});

	sock.ev.on('creds.update', saveCreds);
};

console.log(chalk.yellow(figlet.textSync('TANJIRO BOT', {
	font: 'Standard',
	horizontalLayout: 'default',
	verticalLayout: 'default'
})));

connectToWhatsApp();
