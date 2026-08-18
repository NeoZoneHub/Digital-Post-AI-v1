import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function(sock, from, args, sender, isGroup, isNewsletter, messages) {
    try {
        await sock.sendMessage(from, { 
            text: '🔄 *Redémarrage du bot en cours...*\n\nLe bot va se reconnecter dans quelques secondes.' 
        });

        const restartFile = path.join(__dirname, '..', 'restart.flag');
        fs.writeFileSync(restartFile, 'restart');

        setTimeout(() => {
            process.exit(0);
        }, 2000);

    } catch (error) {
        console.error('Error in restart command:', error);
        await sock.sendMessage(from, { text: '❌ Erreur lors du redémarrage' });
    }
}