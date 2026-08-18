import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function(sock, from, args, sender, isGroup, isNewsletter, messages) {
    try {
        if (!isNewsletter) {
            await sock.sendMessage(from, { 
                text: '❌ Cette commande ne peut être utilisée que dans une chaîne WhatsApp (newsletter)' 
            });
            return;
        }

        const newsletterId = from;

        const resultMessage = `
${newsletterId}

> 💡 Copiez cet ID pour configurer votre projet
        `;

        await sock.sendMessage(from, { text: resultMessage });

    } catch (error) {
        console.error('Error in newsletter command:', error);
        await sock.sendMessage(from, { text: '❌ Erreur lors de la récupération des informations de la chaîne' });
    }
}