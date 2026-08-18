export default async function(sock, from, args, sender, isGroup, isNewsletter, messages) {
    try {
        if (args.length === 0) {
            const helpMessage = `
╔═══════════════════════════╗
      🤖 *DIGITAL POST AI - AIDE*
╠═══════════════════════════╣
📌 *Commandes disponibles:*

.newsletter → Obtenir le JID de la chaîne
.config     → Configurer un nouveau projet
.post       → Créer une publication
.list        → Voir les projets et posts
.delete     → Supprimer un projet/post
.help       → Afficher cette aide
.restart     → Redémarrer le bot
.ia          → Activer l'IA Azyrion 

╠═══════════════════════════╣
💡 *Utilisation:*
.help <commande> pour plus de détails
Exemple: .help config
╚═══════════════════════════╝
            `;
            await sock.sendMessage(from, { text: helpMessage });
            return;
        }

        const commandName = args[0];
        const helpDetails = {
            newsletter: {
                title: '📢 .newsletter',
                description: 'Obtenir le JID de la chaîne WhatsApp',
                usage: '.newsletter',
                details: 'Utilisez cette commande directement dans une chaîne WhatsApp pour obtenir son JID (identifiant unique)'
            },
            config: {
                title: '📝 .config',
                description: 'Configurer un nouveau projet',
                usage: '.config',
                details: 'Le bot vous demandera:\n1️⃣ Le nom du projet\n2️⃣ Le JID de la chaîne (obtenu avec .newsletter)'
            },
            post: {
                title: '📤 .post',
                description: 'Créer une publication',
                usage: '.post',
                details: 'Le bot vous demandera:\n1️⃣ Le contenu du message\n2️⃣ Publier maintenant ou plus tard\n3️⃣ Si plus tard, la date et l\'heure'
            },
            list: {
                title: '📋 .list',
                description: 'Voir tous les projets et publications',
                usage: '.list',
                details: 'Affiche la liste complète des projets configurés et leurs publications (en attente et envoyées)'
            },
            delete: {
                title: '🗑️ .delete',
                description: 'Supprimer un projet ou une publication',
                usage: '.delete ou .delete post',
                details: '.delete → Supprime un projet entier\n.delete post → Supprime une publication en attente'
            },
            help: {
                title: '❓ .help',
                description: 'Afficher l\'aide',
                usage: '.help ou .help <commande>',
                details: '.help → Affiche toutes les commandes\n.help <commande> → Détails d\'une commande spécifique'
            }
        };

        const help = helpDetails[commandName];
        if (!help) {
            await sock.sendMessage(from, { 
                text: `❌ Commande "${commandName}" inconnue. Utilisez .help pour voir toutes les commandes.` 
            });
            return;
        }

        const detailMessage = `
╔══════════════════════════╗
      ${help.title}
╠══════════════════════════╣
📌 ${help.description}

🔧 *Utilisation:*
${help.usage}

📖 *Détails:*
${help.details}
╚══════════════════════════╝
        `;
        await sock.sendMessage(from, { text: detailMessage });

    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(from, { text: '❌ Erreur lors de l\'affichage de l\'aide' });
    }
}