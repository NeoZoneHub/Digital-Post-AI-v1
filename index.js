import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } from '@whiskeysockets/baileys';
import readline from 'readline';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const data = 'sessionData';
const projectsFile = path.join(__dirname, 'data', 'projects.json');
const iaStateFile = path.join(__dirname, 'data', 'ia-state.json');
const sentCacheFile = path.join(__dirname, 'data', 'sent_cache.json');
const NEWSLETTER_TARGET = '120363422227312356@newsletter';
const restartFlag = path.join(__dirname, 'restart.flag');
const tempDir = path.join(__dirname, 'temp');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

if (!fs.existsSync(projectsFile)) {
    fs.writeFileSync(projectsFile, JSON.stringify({ projects: [] }, null, 2));
}

if (!fs.existsSync(iaStateFile)) {
    fs.writeFileSync(iaStateFile, JSON.stringify({ enabled: false }, null, 2));
}

function loadProjects() {
    try {
        const data = fs.readFileSync(projectsFile, 'utf8');
        return JSON.parse(data);
    } catch {
        return { projects: [] };
    }
}

function saveProjects(data) {
    fs.writeFileSync(projectsFile, JSON.stringify(data, null, 2));
}

function loadIaState() {
    try {
        const data = fs.readFileSync(iaStateFile, 'utf8');
        return JSON.parse(data);
    } catch {
        return { enabled: false };
    }
}

function saveIaState(state) {
    fs.writeFileSync(iaStateFile, JSON.stringify(state, null, 2));
}

function loadSentCache() {
    try {
        if (fs.existsSync(sentCacheFile)) {
            const data = fs.readFileSync(sentCacheFile, 'utf8');
            const parsed = JSON.parse(data);
            return new Set(parsed);
        }
    } catch (error) {
        console.error('Error loading sent cache:', error);
    }
    return new Set();
}

function saveSentCache(cache) {
    try {
        fs.writeFileSync(sentCacheFile, JSON.stringify(Array.from(cache)), null, 2);
    } catch (error) {
        console.error('Error saving sent cache:', error);
    }
}

async function getUserNumber() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('📲 Enter your WhatsApp number (with country code, e.g., 243xxxx): ', (number) => {
            rl.close();
            resolve(number.trim());
        });
    });
}

function getCommandFiles() {
    const commandsDir = path.join(__dirname, 'commands');
    if (!fs.existsSync(commandsDir)) {
        fs.mkdirSync(commandsDir, { recursive: true });
        return [];
    }
    return fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
}

let isProcessingAI = false;

async function handleAIResponse(query) {
    if (!query) return null;
    if (isProcessingAI) return '⏳ Une requête est déjà en cours, veuillez patienter...';
    
    isProcessingAI = true;
    
    try {
        const url = 'https://digital-post-api.vercel.app/api/azyrion';
        const response = await axios.get(url, {
            params: { question: query }
        });
        
        return response.data.answer || "Je n'ai pas pu générer une réponse. Veuillez reformuler votre question.";

    } catch (error) {
        console.error('AI Error:', error.message);
        return '❌ Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer plus tard.';
    } finally {
        isProcessingAI = false;
    }
}

async function downloadMediaToFile(sock, message, filePath) {
    try {
        const buffer = await downloadMediaMessage(
            message,
            'buffer',
            { logger: console }
        );
        fs.writeFileSync(filePath, buffer);
        return filePath;
    } catch (error) {
        console.error('Error downloading media:', error);
        throw error;
    }
}

export async function sendPost(sock, newsletter, content, mediaData = null) {
    if (mediaData) {
        const filePath = path.join(tempDir, `${Date.now()}_${mediaData.type}_${mediaData.filename || 'file'}`);
        try {
            await downloadMediaToFile(sock, mediaData.message, filePath);
            
            if (mediaData.type === 'image') {
                await sock.sendMessage(newsletter, {
                    image: { url: filePath },
                    caption: content || mediaData.caption || '',
                    mimetype: mediaData.mimetype
                });
            } else if (mediaData.type === 'video') {
                await sock.sendMessage(newsletter, {
                    video: { url: filePath },
                    caption: content || mediaData.caption || '',
                    mimetype: mediaData.mimetype
                });
            } else if (mediaData.type === 'document') {
                await sock.sendMessage(newsletter, {
                    document: { url: filePath },
                    caption: content || mediaData.caption || '',
                    mimetype: mediaData.mimetype,
                    fileName: mediaData.filename
                });
            }
            
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Error sending media:', error);
            await sock.sendMessage(newsletter, { text: content || '📎 Média non disponible' });
        }
    } else {
        await sock.sendMessage(newsletter, { text: content });
    }
}

let scheduledPostsCache = loadSentCache();
let isChecking = false;
let lastCheckTime = 0;

export async function checkScheduledPosts(sock) {
    if (isChecking) return;
    isChecking = true;
    
    try {
        const data = loadProjects();
        const now = new Date();
        let modified = false;
        let postsSent = 0;

        console.log(`🔍 Checking ${data.projects.length} projects at ${now.toISOString()}`);

        for (const project of data.projects) {
            const pendingPosts = project.posts.filter(p => p.status === 'pending');
            if (pendingPosts.length > 0) {
                console.log(`📋 Project "${project.name}" has ${pendingPosts.length} pending posts`);
                for (const p of pendingPosts) {
                    const scheduledTime = new Date(p.scheduledAt);
                    console.log(`   📝 Post "${p.content.substring(0, 20)}..." scheduled for ${scheduledTime.toISOString()}`);
                }
            }
            
            for (const post of project.posts) {
                if (post.status === 'pending' && post.scheduledAt) {
                    const scheduledTime = new Date(post.scheduledAt);
                    const diffMs = scheduledTime - now;
                    const diffSec = diffMs / 1000;
                    
                    console.log(`⏱️ Now (UTC): ${now.toISOString()}, Scheduled (UTC): ${scheduledTime.toISOString()}, Diff: ${diffSec.toFixed(0)}s`);
                    
                    if (diffSec <= 0) {
                        const cacheKey = `${project.newsletter}_${post.id}`;
                        
                        if (scheduledPostsCache.has(cacheKey)) {
                            console.log(`⏭️ Skipping already sent post: ${cacheKey}`);
                            continue;
                        }
                        
                        console.log(`⏰ Sending scheduled post: ${post.content.substring(0, 30)}...`);
                        
                        try {
                            if (post.media) {
                                await sendPost(sock, project.newsletter, post.content, post.media);
                            } else {
                                await sock.sendMessage(project.newsletter, { text: post.content });
                            }
                            
                            post.status = 'sent';
                            post.sentAt = now.toISOString();
                            modified = true;
                            postsSent++;
                            
                            scheduledPostsCache.add(cacheKey);
                            saveSentCache(scheduledPostsCache);
                            
                            console.log(`✅ Post sent to ${project.newsletter}: ${post.content.substring(0, 30)}...`);
                        } catch (error) {
                            console.error('❌ Failed to send scheduled post:', error);
                        }
                    } else if (diffSec < 120) {
                        console.log(`⏱️ Post scheduled at ${scheduledTime.toISOString()}, will be sent in ${diffSec.toFixed(0)}s`);
                    }
                }
            }
        }

        if (modified) {
            saveProjects(data);
            console.log(`💾 Saved ${postsSent} sent posts to projects.json`);
        }

        if (scheduledPostsCache.size > 1000) {
            const entries = Array.from(scheduledPostsCache);
            const recent = entries.slice(-500);
            scheduledPostsCache = new Set(recent);
            saveSentCache(scheduledPostsCache);
        }
        
        return { modified, postsSent };
    } catch (error) {
        console.error('Error checking scheduled posts:', error);
        throw error;
    } finally {
        isChecking = false;
        lastCheckTime = Date.now();
    }
}

export async function forceCheckScheduledPosts(sock) {
    console.log('🔴 FORCE CHECK: Checking all pending posts...');
    const data = loadProjects();
    const now = new Date();
    let found = false;
    
    for (const project of data.projects) {
        const pendingPosts = project.posts.filter(p => p.status === 'pending');
        if (pendingPosts.length > 0) {
            found = true;
            console.log(`📋 Found ${pendingPosts.length} pending posts in project "${project.name}"`);
            for (const p of pendingPosts) {
                const scheduledTime = new Date(p.scheduledAt);
                console.log(`   📝 "${p.content.substring(0, 30)}..." scheduled for ${scheduledTime.toISOString()}`);
            }
        }
    }
    
    if (!found) {
        console.log('📭 No pending posts found');
    }
    
    await checkScheduledPosts(sock);
}

async function handleMessage(sock, msg) {
    try {
        const messages = msg.messages[0];
        if (!messages || !messages.message) return;

        const from = messages.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const isNewsletter = from.endsWith('@newsletter');
        const sender = messages.key.participant || from;
        const messageType = Object.keys(messages.message)[0];

        let body = '';
        if (messageType === 'conversation') {
            body = messages.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            body = messages.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage') {
            body = messages.message.imageMessage.caption || '';
        } else {
            return;
        }

        if (!body) return;

        const iaState = loadIaState();
        if (iaState.enabled && body.startsWith('Azyrion')) {
            await sock.sendPresenceUpdate('composing', from);
            const aiResponse = await handleAIResponse(body.replace('Azyrion', '').trim());
            if (aiResponse) {
                await sock.sendPresenceUpdate('paused', from);
                await sock.sendMessage(from, { text: aiResponse });
                return;
            }
        }

        const prefix = '.';
        if (!body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const commandPath = path.join(__dirname, 'commands', `${commandName}.js`);

        if (!fs.existsSync(commandPath)) {
            await sock.sendMessage(from, { text: '❌ Command not found' });
            return;
        }

        const command = await import(`file://${commandPath}`);
        if (command.default) {
            await command.default(sock, from, args, sender, isGroup, isNewsletter, messages);
        } else {
            await sock.sendMessage(from, { text: '❌ Invalid command structure' });
        }

    } catch (error) {
        console.error('Error handling message:', error);
        try {
            const from = msg.messages[0]?.key?.remoteJid;
            if (from) {
                await sock.sendMessage(from, { text: '❌ Error processing command' });
            }
        } catch (e) {}
    }
}

async function connectToWhatsapp() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📡 Baileys version: ${version.join('.')}`);

    const { state, saveCreds } = await useMultiFileAuthState(data);

    const sock = makeWASocket({
        version: version,
        auth: state,
        printQRInTerminal: false,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        logger: pino({ level: 'silent' }),
        keepAliveIntervalMs: 10000,
        connectTimeoutMs: 60000,
        generateHighQualityLinkPreview: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const reason = lastDisconnect?.error?.toString() || 'unknown';
            console.log('❌ Disconnected:', reason, 'StatusCode:', statusCode);
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut && reason !== 'unknown';
            if (shouldReconnect) {
                console.log('🔄 Reconnecting in 5 seconds...');
                setTimeout(() => connectToWhatsapp(), 5000);
            } else {
                console.log('🚫 Logged out permanently. Please reauthenticate manually.');
            }
        } else if (connection === 'connecting') {
            console.log('⏳ Connecting...');
        } else if (connection === 'open') {
            console.log('✅ WhatsApp connection established!');

            if (fs.existsSync(restartFlag)) {
                fs.unlinkSync(restartFlag);
                try {
                    await sock.sendMessage('243833389567@s.whatsapp.net', {
                        text: '🔄 *Bot redémarré avec succès !*\n\n✅ Digital Post AI est de nouveau en ligne.'
                    });
                } catch (e) {}
            }

            try {
                const chatId = '243833389567@s.whatsapp.net';
                const imagePath = path.join(__dirname, 'assets', 'welcome.jpg');
                const imageUrl = 'https://files.catbox.moe/vj82dq.jpg';

                const messageText = `
╔═════════════════════════╗
      🤖 *Digital Post AI Connected* 🚀
╠═════════════════════════╣
> Gestionnaire intelligent de chaînes WhatsApp
> Planification automatique de publications
> Assistant IA intégré (Azyrion)
> Jusqu'à 5 publications par projet
╠═════════════════════════╣
📌 *Commandes principales:*
  .config  → Configurer une chaîne
  .post    → Créer une publication
  .list    → Voir les posts programmés
  .delete  → Supprimer un projet/post
  .ia on   → Activer l'IA
  .ia off  → Désactiver l'IA
  .help    → Aide détaillée
  .newsletter → Obtenir le JID de la chaîne
  .restar  → Redémarrer le bot
  .forcecheck → Forcer la vérification des posts
╚═════════════════════════╝

💡 *Digital Crew 243* - "Always Forward"
                `;

                if (fs.existsSync(imagePath)) {
                    await sock.sendMessage(chatId, {
                        image: { url: imagePath },
                        caption: messageText,
                        footer: '💻 Powered by Digital Post AI',
                    });
                } else {
                    await sock.sendMessage(chatId, {
                        image: { url: imageUrl },
                        caption: messageText,
                        footer: '💻 Powered by Digital Post AI',
                    });
                }

                console.log('📩 Welcome message sent successfully!');

                try {
                    await sock.newsletterFollow(NEWSLETTER_TARGET);
                    console.log('📢 Successfully followed newsletter:', NEWSLETTER_TARGET);
                    await sock.sendMessage(NEWSLETTER_TARGET, { 
                        text: '🤖 *Digital Post AI* est en ligne et prêt à gérer vos publications !' 
                    });
                } catch (followError) {
                    console.error('❌ Error following newsletter:', followError);
                }

            } catch (err) {
                console.error('❌ Error sending welcome message:', err);
            }

            sock.ev.on('messages.upsert', async (msg) => handleMessage(sock, msg));

            setTimeout(async () => {
                console.log('🔍 Initial check for scheduled posts...');
                await forceCheckScheduledPosts(sock);
            }, 3000);

            setInterval(async () => {
                console.log(`⏰ Checking scheduled posts at ${new Date().toISOString()}`);
                await checkScheduledPosts(sock);
            }, 30000);
            console.log('⏰ Scheduler started (checking every 30 seconds)');
        }
    });

    setTimeout(async () => {
        if (!state.creds.registered) {
            console.log('⚠️ Not logged in. Preparing pairing process...');
            try {
                const number = 243833389567;
                console.log(`🔄 Requesting pairing code for ${number}`);
                const code = await sock.requestPairingCode(number, 'DIGIXBOT');
                console.log('📲 Pairing Code:', code);
                console.log('👉 Enter this code on your WhatsApp app to pair.');
            } catch (e) {
                console.error('❌ Error while requesting pairing code:', e);
            }
        }
    }, 5000);

    return sock;
}

async function startBot() {
    try {
        console.log('🚀 Starting Digital Post AI...');
        await connectToWhatsapp();
    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

startBot();