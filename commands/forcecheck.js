export default async function(sock, from, args, sender, isGroup, isNewsletter, messages) {
    try {
        await sock.sendMessage(from, { 
            text: '🔍 *Vérification forcée en cours...*\n\nJe vais vérifier toutes les publications programmées.' 
        });
        
        const { forceCheckScheduledPosts } = await import('../index.js');
        await forceCheckScheduledPosts(sock);
        
        await sock.sendMessage(from, { 
            text: '✅ *Vérification terminée !*\n\nLes publications programmées ont été vérifiées. Consultez les logs du serveur pour plus de détails.' 
        });
    } catch (error) {
        console.error('Error in forcecheck command:', error);
        await sock.sendMessage(from, { 
            text: `❌ Erreur lors de la vérification forcée: ${error.message}` 
        });
    }
}