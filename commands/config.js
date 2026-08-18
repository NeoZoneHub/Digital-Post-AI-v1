import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectsFile = path.join(__dirname, '..', 'data', 'projects.json');

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

const userStates = {};

export default async function(sock, from, args, sender, isGroup, isNewsletter, messages) {
    try {
        if (!userStates[from]) {
            userStates[from] = { step: 'waiting_name' };
            await sock.sendMessage(from, { 
                text: '📝 *Configuration d\'un nouveau projet*\n\nVeuillez entrer le *nom du projet* :' 
            });
            return;
        }

        const state = userStates[from];

        if (state.step === 'waiting_name') {
            const name = args.join(' ');
            if (!name) {
                await sock.sendMessage(from, { text: '❌ Veuillez entrer un nom valide pour le projet' });
                return;
            }
            state.name = name;
            state.step = 'waiting_newsletter';
            await sock.sendMessage(from, { 
                text: `✅ Projet "${name}" enregistré\n\nMaintenant, veuillez entrer le *JID de la chaîne* (ex: 120363422227312356@newsletter) :` 
            });
            return;
        }

        if (state.step === 'waiting_newsletter') {
            const newsletter = args[0];
            if (!newsletter || !newsletter.endsWith('@newsletter')) {
                await sock.sendMessage(from, { 
                    text: '❌ JID invalide. Le JID doit se terminer par @newsletter' 
                });
                return;
            }

            const data = loadProjects();
            const existingProject = data.projects.find(p => p.newsletter === newsletter);
            if (existingProject) {
                await sock.sendMessage(from, { 
                    text: `❌ Cette chaîne est déjà configurée avec le projet "${existingProject.name}"` 
                });
                delete userStates[from];
                return;
            }

            const projectId = Date.now().toString();
            data.projects.push({
                id: projectId,
                name: state.name,
                newsletter: newsletter,
                posts: [],
                createdAt: new Date().toISOString()
            });
            saveProjects(data);

            await sock.sendMessage(from, { 
                text: `✅ *Projet configuré avec succès !*\n\n📌 Nom: ${state.name}\n🆔 JID: ${newsletter}\n📅 Créé le: ${new Date().toLocaleString()}\n\nUtilisez .post pour créer une publication` 
            });

            delete userStates[from];
        }

    } catch (error) {
        console.error('Error in config command:', error);
        await sock.sendMessage(from, { text: '❌ Erreur lors de la configuration du projet' });
        delete userStates[from];
    }
}