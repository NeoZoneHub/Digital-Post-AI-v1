
# 🤖 Digital Post AI

<div align="center">
  <img src="https://files.catbox.moe/y47h3b.png" alt="Digital Post AI" width="400"/>
  <br/>
  <h3>🚀 Gestionnaire intelligent de chaînes WhatsApp</h3>
  <p><i>Planifiez et automatisez vos publications sur les chaînes WhatsApp</i></p>
  <br/>
  
  [![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/998771529519)
  [![WhatsApp Group](https://img.shields.io/badge/WhatsApp_Group-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://chat.whatsapp.com/Kiz7Rx4ncndCaPStWmhhh5)
  [![WhatsApp Channel](https://img.shields.io/badge/WhatsApp_Channel-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com/channel/0029VbBT7FdLCoX1TDyQQb1B)
  
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
  [![License](https://img.shields.io/badge/License-MIT-1E90FF?style=for-the-badge)](LICENSE)
  
  [![Deploy on Railway](https://img.shields.io/badge/Deploy_on_Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/)
  [![Deploy on Vercel](https://img.shields.io/badge/Deploy_on_Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
  [![Deploy on Render](https://img.shields.io/badge/Deploy_on_Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)
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
git clone https://github.com/NeoZoneHub/Digital-Post-AI-v1.git
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


| Commande | Description | Utilisation |
|----------|-------------|-------------|
| `.config` | Configurer un nouveau projet | Guide étape par étape |
| `.post` | Créer une publication | Avec ou sans média |
| `.list` | Voir tous les projets et posts | Aperçu complet |
| `.delete` | Supprimer un projet ou un post | Avec confirmation |
| `.ia on/off` | Activer/Désactiver l'IA | Persistant après redémarrage |
| `.help` | Afficher l'aide | `.help` ou `.help <commande>` |
| `.newsletter` | Obtenir le JID d'une chaîne | À utiliser DANS la chaîne |
| `.restar` | Redémarrer le bot | Envoie un message de confirmation |
| `.forcecheck` | Forcer la vérification des posts | Vérification manuelle |

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


## 🆘 Support

### 📱 Numéro du développeur
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/998771529519)

### 💬 Groupe de support WhatsApp
[![WhatsApp Group](https://img.shields.io/badge/WhatsApp_Group-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://chat.whatsapp.com/Kiz7Rx4ncndCaPStWmhhh5)

### 📢 Chaîne WhatsApp officielle
[![WhatsApp Channel](https://img.shields.io/badge/WhatsApp_Channel-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com/channel/0029VbBT7FdLCoX1TDyQQb1B)

### 🐛 Signaler un bug
[![GitHub Issues](https://img.shields.io/badge/GitHub_Issues-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ton-repo/digital-post-ai/issues)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/998771529519)

---

## 📄 Licence

[![License](https://img.shields.io/badge/License-MIT-1E90FF?style=for-the-badge)](LICENSE)
MIT © [Digital Crew 243](https://whatsapp.com/channel/0029VbBT7FdLCoX1TDyQQb1B)

---

<div align="center">
  <p><b>💻 Digital Crew 243</b> - <i>"Always Forward"</i></p>
  <p>⭐ N'oubliez pas de laisser une étoile si ce projet vous a été utile !</p>
</div>