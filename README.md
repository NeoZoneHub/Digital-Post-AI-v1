
# 🤖 Digital Post AI

<div align="center">
  <img src="https://files.catbox.moe/vj82dq.jpg" alt="Digital Post AI" width="200"/>
  <br/>
  <h3>🚀 Gestionnaire intelligent de chaînes WhatsApp</h3>
  <p><i>Planifiez et automatisez vos publications sur les chaînes WhatsApp</i></p>
</div>

---

## 📋 À propos

**Digital Post AI** est un bot WhatsApp puissant conçu pour gérer et automatiser les publications sur les chaînes WhatsApp. Il permet de planifier des messages, des images et des vidéos avec une interface conversationnelle simple et intuitive.

### ✨ Fonctionnalités principales

- 📝 **Planification de publications** : Programmez vos posts jusqu'à 5 en attente par projet
- 🖼️ **Support multimédia** : Images, vidéos et documents en vue normale
- 🤖 **Assistant IA intégré** : Azyrion, votre assistant intelligent pour vous guider
- 📊 **Gestion multi-projets** : Gérez plusieurs chaînes simultanément
- ⏰ **Publication automatique** : Envoi programmé à la date et heure choisies
- 🗑️ **Gestion complète** : Liste, suppression et modification des publications
- 🔄 **Redémarrage distant** : Redémarrez le bot via commande WhatsApp

---

## 🛠️ Technologies utilisées

| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| **Node.js** | ≥ 18.0.0 | Runtime JavaScript |
| **Baileys** | ^6.7.10 | Library WhatsApp Web |
| **Axios** | ^1.7.7 | Requêtes HTTP |
| **Node-cron** | ^3.0.3 | Planification des tâches |
| **Pino** | ^9.4.0 | Logging |
| **WS** | ^8.18.0 | WebSocket |
| **JavaScript** | ES Modules | Langage principal |

---

## 📦 Installation

### Prérequis

```bash
# Vérifier Node.js
node --version  # ≥ v18.0.0

# Vérifier npm
npm --version
```

Étapes d'installation

```bash
# 1. Cloner le repository
git clone https://github.com/ton-repo/digital-post-ai.git
cd digital-post-ai

# 2. Installer les dépendances
npm install

# 3. Lancer le bot
npm start
```

---

⚙️ Configuration

Fichiers à configurer

1. index.js - Configuration principale

```javascript
// Ligne 10 - Numéro WhatsApp du propriétaire
const chatId = '243833389567@s.whatsapp.net';

// Ligne 11 - Chaîne par défaut (newsletter)
const NEWSLETTER_TARGET = '120363422227312356@newsletter';

// Ligne 571 - Numéro pour l'appairage
const number = 243833389567;
```

2. data/projects.json - Stockage des projets

Créé automatiquement au premier lancement

```json
{
  "projects": [
    {
      "id": "1678901234567",
      "name": "Nom du projet",
      "newsletter": "120363XXXXXX@newsletter",
      "posts": [],
      "createdAt": "2026-08-28T12:00:00.000Z"
    }
  ]
}
```

3. data/ia-state.json - État de l'IA

```json
{
  "enabled": false
}
```

4. data/sent_cache.json - Cache des publications envoyées

Géré automatiquement

---

📱 Commandes disponibles

Commande Description Utilisation
.config Configurer un nouveau projet Guide étape par étape
.post Créer une publication Avec ou sans média
.list Voir tous les projets et posts Aperçu complet
.delete Supprimer un projet ou un post Avec confirmation
.ia on/off Activer/Désactiver l'IA Persistant après redémarrage
.help Afficher l'aide .help ou .help <commande>
.newsletter Obtenir le JID d'une chaîne À utiliser DANS la chaîne
.restar Redémarrer le bot Envoie un message de confirmation

---

🤖 Assistant IA - Azyrion

L'assistant IA Azyrion répond à toutes vos questions sur l'utilisation du bot.

Activation

```bash
.ia on      # Activer l'IA
.ia off     # Désactiver l'IA
.ia         # Voir l'état
```

Utilisation

```bash
Azyrion comment configurer une chaîne ?
Azyrion comment programmer un post ?
Azyrion comment publier une image ?
```

---

📂 Structure du projet

```
digital-post-ai/
├── index.js              # Point d'entrée principal
├── package.json          # Dépendances et scripts
├── package-lock.json     # Lock des dépendances
├── README.md             # Documentation
│
├── commands/             # Commandes du bot
│   ├── config.js         # Configuration des projets
│   ├── post.js           # Création de publications
│   ├── list.js           # Liste des projets/posts
│   ├── delete.js         # Suppression
│   ├── ia.js             # Gestion de l'IA
│   ├── help.js           # Aide
│   ├── newsletter.js     # Récupération du JID
│   ├── restar.js         # Redémarrage
│   └── forcecheck.js     # Vérification forcée
│
├── data/                 # Données persistance
│   ├── sessionData/      # Session WhatsApp
│   ├── projects.json     # Projets et publications
│   ├── ia-state.json     # État de l'IA
│   └── sent_cache.json   # Cache des posts envoyés
│
├── assets/               # Ressources
│   └── welcome.jpg       # Image de bienvenue (optionnel)
│
└── temp/                 # Fichiers temporaires (médias)
```

---

🚀 Démarrage rapide

1. Configurer une chaîne

```bash
1. Allez dans votre chaîne WhatsApp
2. Tapez : .newsletter
3. Copiez le JID affiché
4. Tapez : .config
5. Entrez le nom du projet
6. Collez le JID de la chaîne
```

2. Créer une publication

```bash
1. Tapez : .post
2. Entrez le contenu du message
3. Choisissez "Maintenant" ou "Plus tard"
4. Si "Plus tard", entrez : YYYY-MM-DD HH:MM
```

3. Publier avec une image

```bash
1. Répondez à l'image avec : .post
2. Le bot détecte automatiquement le média
3. Choisissez "Maintenant" ou "Plus tard"
```

---

🔄 Redémarrage du bot

Depuis WhatsApp

```bash
.restar
```

Le bot redémarre et envoie un message de confirmation.

Depuis le terminal

```bash
npm start
# ou
node index.js
```

---

🆘 Support

📱 Numéro du développeur

+998 77 152 95 19

💬 Groupe de support WhatsApp

Join Digital Crew 243

📢 Chaîne WhatsApp officielle

Digital Post AI Channel

🐛 Signaler un bug

Ouvrez une issue sur le repository GitHub ou contactez via WhatsApp.

---

📄 Licence

MIT © Digital Crew 243

---

<div align="center">
  <p><b>💻 Digital Crew 243</b> - <i>"Always Forward"</i></p>
  <p>⭐ N'oubliez pas de laisser une étoile si ce projet vous a été utile !</p>
</div>
