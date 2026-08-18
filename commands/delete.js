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
        const data = loadProjects();
        
        if (data.projects.length === 0) {
            await sock.sendMessage(from, { 
                text: '📭 Aucun projet configuré.' 
            });
            return;
        }

        if (!userStates[from]) {
            let projectList = '📋 *Choisissez un projet à supprimer*\n\n';
            data.projects.forEach((p, index) => {
                projectList += `${index + 1}. ${p.name} (${p.posts.length} publications)\n`;
            });
            projectList += '\nRépondez avec le numéro du projet à supprimer';
            projectList += '\n💡 Pour supprimer une publication spécifique, utilisez .delete post';

            userStates[from] = { step: 'select_project' };
            await sock.sendMessage(from, { text: projectList });
            return;
        }

        const state = userStates[from];

        if (state.step === 'select_project') {
            const index = parseInt(args[0]) - 1;
            if (isNaN(index) || index < 0 || index >= data.projects.length) {
                await sock.sendMessage(from, { text: '❌ Numéro invalide' });
                return;
            }

            const project = data.projects[index];
            state.projectId = project.id;
            state.step = 'confirm_delete';

            await sock.sendMessage(from, { 
                text: `⚠️ *Confirmation de suppression*\n\nProjet: ${project.name}\nPublications: ${project.posts.length}\n\nTapez .delete confirm pour confirmer la suppression du projet` 
            });
            return;
        }

        if (state.step === 'confirm_delete' && args[0] === 'confirm') {
            const data2 = loadProjects();
            const projectIndex = data2.projects.findIndex(p => p.id === state.projectId);
            if (projectIndex !== -1) {
                const project = data2.projects[projectIndex];
                data2.projects.splice(projectIndex, 1);
                saveProjects(data2);
                await sock.sendMessage(from, { 
                    text: `✅ Projet "${project.name}" supprimé avec succès !` 
                });
            }
            delete userStates[from];
            return;
        }

        if (args[0] === 'post') {
            const userProjects = data.projects.filter(p => p.newsletter === from || p.newsletter === from);
            if (userProjects.length === 0) {
                await sock.sendMessage(from, { 
                    text: '❌ Aucun projet configuré pour cette chaîne' 
                });
                delete userStates[from];
                return;
            }

            const project = userProjects[0];
            const pendingPosts = project.posts.filter(p => p.status === 'pending');
            
            if (pendingPosts.length === 0) {
                await sock.sendMessage(from, { 
                    text: '📭 Aucune publication en attente à supprimer' 
                });
                delete userStates[from];
                return;
            }

            let postList = '📋 *Publications en attente*\n\n';
            pendingPosts.forEach((p, index) => {
                const date = new Date(p.scheduledAt);
                postList += `${index + 1}. ${p.content.substring(0, 30)}${p.content.length > 30 ? '...' : ''}\n`;
                postList += `   📅 ${date.toLocaleString()}\n\n`;
            });
            postList += 'Répondez avec le numéro de la publication à supprimer';

            state.step = 'select_post';
            state.projectId = project.id;
            await sock.sendMessage(from, { text: postList });
            return;
        }

        if (state.step === 'select_post') {
            const index = parseInt(args[0]) - 1;
            const data2 = loadProjects();
            const proj = data2.projects.find(p => p.id === state.projectId);
            
            if (!proj) {
                await sock.sendMessage(from, { text: '❌ Projet introuvable' });
                delete userStates[from];
                return;
            }

            const pendingPosts = proj.posts.filter(p => p.status === 'pending');
            if (isNaN(index) || index < 0 || index >= pendingPosts.length) {
                await sock.sendMessage(from, { text: '❌ Numéro invalide' });
                return;
            }

            const postToDelete = pendingPosts[index];
            const postIndex = proj.posts.indexOf(postToDelete);
            proj.posts.splice(postIndex, 1);
            saveProjects(data2);

            await sock.sendMessage(from, { 
                text: `✅ Publication supprimée avec succès !` 
            });
            delete userStates[from];
        }

    } catch (error) {
        console.error('Error in delete command:', error);
        await sock.sendMessage(from, { text: '❌ Erreur lors de la suppression' });
        delete userStates[from];
    }
}