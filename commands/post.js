import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectsFile = path.join(__dirname, '..', 'data', 'projects.json');
const tempDir = path.join(__dirname, '..', 'temp');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
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

function getMessageType(message) {
    if (message.conversation) return 'text';
    if (message.extendedTextMessage) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.documentMessage) return 'document';
    return 'text';
}

function getMessageContent(message) {
    if (message.conversation) return { text: message.conversation };
    if (message.extendedTextMessage) return { text: message.extendedTextMessage.text };
    if (message.imageMessage) {
        return {
            type: 'image',
            url: message.imageMessage.url,
            caption: message.imageMessage.caption || '',
            mimetype: message.imageMessage.mimetype || 'image/jpeg'
        };
    }
    if (message.videoMessage) {
        return {
            type: 'video',
            url: message.videoMessage.url,
            caption: message.videoMessage.caption || '',
            mimetype: message.videoMessage.mimetype || 'video/mp4'
        };
    }
    if (message.documentMessage) {
        return {
            type: 'document',
            url: message.documentMessage.url,
            caption: message.documentMessage.caption || '',
            mimetype: message.documentMessage.mimetype || 'application/pdf',
            filename: message.documentMessage.fileName || 'document'
        };
    }
    return { text: '' };
}

async function downloadMedia(url, filePath) {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
    });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function sendPost(sock, newsletter, content, mediaData = null) {
    if (mediaData) {
        const filePath = path.join(tempDir, `${Date.now()}_${mediaData.type}_${path.basename(mediaData.url || 'file')}`);
        try {
            await downloadMedia(mediaData.url, filePath);
            
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

const userStates = {};

export default async function(sock, from, args, sender, isGroup, isNewsletter, messages) {
    try {
        const data = loadProjects();
        
        if (data.projects.length === 0) {
            await sock.sendMessage(from, { 
                text: '❌ Aucun projet configuré. Utilisez .config d\'abord.' 
            });
            return;
        }

        const quotedMsg = messages.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let quotedContent = null;
        let quotedMedia = null;

        if (quotedMsg) {
            const msgType = getMessageType(quotedMsg);
            const content = getMessageContent(quotedMsg);
            if (msgType === 'text') {
                quotedContent = content.text;
            } else if (msgType === 'image' || msgType === 'video' || msgType === 'document') {
                quotedMedia = content;
                quotedContent = content.caption || '';
            }
        }

        if (!userStates[from]) {
            if (data.projects.length === 1) {
                userStates[from] = { 
                    step: 'waiting_content', 
                    projectId: data.projects[0].id,
                    hasMedia: !!quotedMedia,
                    mediaData: quotedMedia
                };
                if (quotedMedia) {
                    userStates[from].content = quotedContent || '';
                    userStates[from].step = 'waiting_schedule';
                    await sock.sendMessage(from, { 
                        text: `📝 *Publication avec média*\nProjet: ${data.projects[0].name}\n📎 Média: ${quotedMedia.type}\n${quotedContent ? `📝 Texte: ${quotedContent.substring(0, 50)}...` : ''}\n\nVoulez-vous publier :\n1️⃣ *Maintenant*\n2️⃣ *Plus tard*\n\nRépondez avec 1 ou 2 :` 
                    });
                    return;
                }
                await sock.sendMessage(from, { 
                    text: `📝 *Création d'une publication*\nProjet: ${data.projects[0].name}\n\nVeuillez entrer le *contenu* du message à publier :\n💡 Vous pouvez aussi répondre à une image/vidéo pour l'inclure.` 
                });
                return;
            }

            let projectList = '📋 *Choisissez un projet*\n\n';
            data.projects.forEach((p, index) => {
                const postCount = p.posts.filter(post => post.status === 'pending').length;
                projectList += `${index + 1}. ${p.name} (${postCount}/5 publications en attente)\n`;
            });
            projectList += '\nRépondez avec le numéro du projet :';

            userStates[from] = { 
                step: 'select_project',
                hasMedia: !!quotedMedia,
                mediaData: quotedMedia
            };
            await sock.sendMessage(from, { text: projectList });
            return;
        }

        const state = userStates[from];

        if (state.step === 'select_project') {
            const index = parseInt(args[0]) - 1;
            if (isNaN(index) || index < 0 || index >= data.projects.length) {
                await sock.sendMessage(from, { text: '❌ Numéro invalide. Répondez avec le numéro du projet.' });
                return;
            }

            const project = data.projects[index];
            const pendingPosts = project.posts.filter(p => p.status === 'pending');
            
            if (pendingPosts.length >= 5) {
                await sock.sendMessage(from, { 
                    text: `❌ Le projet "${project.name}" a déjà 5 publications en attente. Supprimez-en une avec .delete post.` 
                });
                delete userStates[from];
                return;
            }

            state.projectId = project.id;
            state.step = 'waiting_content';
            
            if (state.hasMedia && state.mediaData) {
                state.content = state.mediaData.caption || '';
                state.step = 'waiting_schedule';
                await sock.sendMessage(from, { 
                    text: `📝 *Publication avec média*\nProjet: ${project.name}\n📎 Média: ${state.mediaData.type}\n${state.content ? `📝 Texte: ${state.content.substring(0, 50)}...` : ''}\n\nVoulez-vous publier :\n1️⃣ *Maintenant*\n2️⃣ *Plus tard*\n\nRépondez avec 1 ou 2 :` 
                });
                return;
            }

            await sock.sendMessage(from, { 
                text: `📝 *Création d'une publication*\nProjet: ${project.name}\n\nVeuillez entrer le *contenu* du message à publier :\n💡 Vous pouvez aussi répondre à une image/vidéo pour l'inclure.` 
            });
            return;
        }

        if (state.step === 'waiting_content') {
            let content = args.join(' ');
            
            if (!content && !state.hasMedia) {
                await sock.sendMessage(from, { text: '❌ Veuillez entrer un contenu valide' });
                return;
            }

            if (state.hasMedia && state.mediaData) {
                state.content = content || state.mediaData.caption || '';
                state.mediaData = state.mediaData;
            } else {
                state.content = content;
            }

            state.step = 'waiting_schedule';
            await sock.sendMessage(from, { 
                text: `📝 Contenu: ${state.content.substring(0, 50)}${state.content.length > 50 ? '...' : ''}${state.mediaData ? `\n📎 Média: ${state.mediaData.type}` : ''}\n\nVoulez-vous publier :\n1️⃣ *Maintenant*\n2️⃣ *Plus tard*\n\nRépondez avec 1 ou 2 :` 
            });
            return;
        }

        if (state.step === 'waiting_schedule') {
            const choice = args[0];
            if (choice === '1') {
                try {
                    const data2 = loadProjects();
                    const proj = data2.projects.find(p => p.id === state.projectId);
                    if (proj) {
                        if (state.mediaData) {
                            await sendPost(sock, proj.newsletter, state.content, state.mediaData);
                        } else {
                            await sendPost(sock, proj.newsletter, state.content);
                        }
                        proj.posts.push({
                            id: Date.now().toString(),
                            content: state.content,
                            media: state.mediaData || null,
                            status: 'sent',
                            sentAt: new Date().toISOString()
                        });
                        saveProjects(data2);
                    }
                    await sock.sendMessage(from, { text: '✅ Publication envoyée avec succès !' });
                    delete userStates[from];
                } catch (error) {
                    console.error('Error sending post:', error);
                    await sock.sendMessage(from, { text: '❌ Erreur lors de l\'envoi de la publication' });
                }
                return;
            }

            if (choice === '2') {
                state.step = 'waiting_datetime';
                await sock.sendMessage(from, { 
                    text: '📅 Entrez la *date et l\'heure* de publication (format: YYYY-MM-DD HH:MM)\n\nExemple: 2026-08-10 15:30' 
                });
                return;
            }

            await sock.sendMessage(from, { text: '❌ Choix invalide. Répondez avec 1 ou 2' });
            return;
        }

        if (state.step === 'waiting_datetime') {
            const datetime = args.join(' ');
            const scheduledTime = new Date(datetime);
            
            if (isNaN(scheduledTime.getTime())) {
                await sock.sendMessage(from, { 
                    text: '❌ Format invalide. Utilisez: YYYY-MM-DD HH:MM\nExemple: 2026-08-10 15:30' 
                });
                return;
            }

            const now = new Date();
            if (scheduledTime <= now) {
                await sock.sendMessage(from, { text: '❌ La date doit être dans le futur' });
                return;
            }

            const data2 = loadProjects();
            const proj = data2.projects.find(p => p.id === state.projectId);
            if (proj) {
                proj.posts.push({
                    id: Date.now().toString(),
                    content: state.content,
                    media: state.mediaData || null,
                    status: 'pending',
                    scheduledAt: scheduledTime.toISOString()
                });
                saveProjects(data2);
            }

            const formattedDate = scheduledTime.toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            await sock.sendMessage(from, { 
                text: `✅ Publication programmée avec succès !\n\n📝 Contenu: ${state.content.substring(0, 50)}${state.content.length > 50 ? '...' : ''}${state.mediaData ? `\n📎 Média: ${state.mediaData.type}` : ''}\n📅 Prévue le: ${formattedDate}\n\nLe bot publiera automatiquement à l'heure prévue.` 
            });

            delete userStates[from];
        }

    } catch (error) {
        console.error('Error in post command:', error);
        await sock.sendMessage(from, { text: '❌ Erreur lors de la création de la publication' });
        delete userStates[from];
    }
}