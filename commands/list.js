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

export default async function(sock, from, args, sender, isGroup, isNewsletter, messages) {
    try {
        const data = loadProjects();
        
        if (data.projects.length === 0) {
            await sock.sendMessage(from, { 
                text: '📭 Aucun projet configuré. Utilisez .config pour commencer.' 
            });
            return;
        }

        let response = '📋 *LISTE DES PROJETS ET PUBLICATIONS*\n\n';

        for (const project of data.projects) {
            const totalPosts = project.posts.length;
            const pendingPosts = project.posts.filter(p => p.status === 'pending').length;
            const sentPosts = project.posts.filter(p => p.status === 'sent').length;

            response += `📌 *${project.name}*\n`;
            response += `   🆔 JID: ${project.newsletter}\n`;
            response += `   📊 Total: ${totalPosts} | ⏳ En attente: ${pendingPosts} | ✅ Envoyés: ${sentPosts}\n\n`;

            if (project.posts.length > 0) {
                const recentPosts = project.posts.slice(-3);
                for (const post of recentPosts) {
                    const status = post.status === 'pending' ? '⏳' : '✅';
                    const date = post.scheduledAt || post.sentAt || '';
                    const dateObj = date ? new Date(date) : null;
                    const dateStr = dateObj ? dateObj.toLocaleString() : 'N/A';
                    response += `   ${status} ${post.content.substring(0, 30)}${post.content.length > 30 ? '...' : ''}\n`;
                    response += `   📅 ${dateStr}\n\n`;
                }
                if (project.posts.length > 3) {
                    response += `   ... et ${project.posts.length - 3} autres publications\n\n`;
                }
            } else {
                response += `   📭 Aucune publication\n\n`;
            }
        }

        response += '💡 Utilisez .delete pour supprimer un projet ou une publication';

        await sock.sendMessage(from, { text: response });

    } catch (error) {
        console.error('Error in list command:', error);
        await sock.sendMessage(from, { text: '❌ Erreur lors de la récupération de la liste' });
    }
}