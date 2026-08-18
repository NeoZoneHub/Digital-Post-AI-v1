import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iaStateFile = path.join(__dirname, '..', 'data', 'ia-state.json');

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

export default async function(sock, from, args, sender, isGroup, isNewsletter, messages) {
    try {
        if (args.length === 0) {
            const state = loadIaState();
            const status = state.enabled ? '✅ Activée' : '❌ Désactivée';
            await sock.sendMessage(from, { 
                text: `🤖 *État de l'IA:* ${status}\n\nUtilisation:\n.ia on → Activer\n.ia off → Désactiver` 
            });
            return;
        }

        const action = args[0].toLowerCase();
        const iaState = loadIaState();

        if (action === 'on') {
            iaState.enabled = true;
            saveIaState(iaState);
            await sock.sendMessage(from, { 
                text: '✅ *IA activée avec succès !*\n\nJe répondrai désormais à tous les messages commençant par *Azyrion*.' 
            });
        } else if (action === 'off') {
            iaState.enabled = false;
            saveIaState(iaState);
            await sock.sendMessage(from, { 
                text: '❌ IA désactivée. Je ne répondrai plus aux messages.' 
            });
        } else {
            await sock.sendMessage(from, { 
                text: '❌ Utilisation: .ia on | .ia off | .ia' 
            });
        }

    } catch (error) {
        console.error('Error in ia command:', error);
        await sock.sendMessage(from, { text: '❌ Erreur lors de l\'exécution de la commande' });
    }
}