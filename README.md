# Cosmetest - Application de gestion des tests cosmétiques

Cosmetest est une application web moderne pour la gestion des tests cosmétiques, incluant la gestion des volontaires, des études, des rendez-vous et plus encore.

## Fonctionnalités

- Authentification sécurisée
- Tableau de bord avec statistiques et activités récentes
- Gestion complète des volontaires
- Gestion des études et des panels
- Planification des rendez-vous avec vue calendrier
- Interface responsive et intuitive
- Design moderne avec Tailwind CSS

## Technologies utilisées

- **Frontend**: React, Tailwind CSS, Vite
- **Communication avec le backend**: Axios
- **Routing**: React Router
- **Gestion des dates**: date-fns
- **Authentication**: JWT

## Installation

### Prérequis

- Node.js (version 18.x ou supérieure)
- npm ou yarn

### Étapes d'installation

1. Clonez le dépôt:
   ```bash
   git clone https://github.com/votre-compte/cosmetest-app.git
   cd cosmetest-app
   ```

2. Installez les dépendances:
   ```bash
   npm install
   # ou
   yarn
   ```

3. Créez un fichier `.env` à la racine du projet et configurez l'URL de l'API:
   ```
   VITE_API_URL=http://localhost:8080/api
   ```

4. Lancez l'application en mode développement:
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

5. L'application sera disponible à l'adresse [http://localhost:3000](http://localhost:3000)

## Structure du projet

```
cosmetest-app/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   ├── Layout/
│   │   ├── Dashboard/
│   │   ├── Volontaires/
│   │   ├── Etudes/
│   │   └── RendezVous/
│   ├── services/
│   ├── utils/
│   ├── hooks/
│   ├── context/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

## Déploiement

Pour construire l'application pour la production:

```bash
npm run build
# ou
yarn build
```

Les fichiers générés seront dans le dossier `dist` et peuvent être déployés sur n'importe quel serveur web statique.

## Configuration du proxy pour le développement

Pour éviter les problèmes de CORS pendant le développement, le fichier `vite.config.js` est configuré pour faire suivre toutes les requêtes `/api` vers votre serveur backend. Assurez-vous que votre API backend fonctionne à l'URL configurée.

## Personnalisation

### Thème

Le thème de l'application est configuré dans le fichier `tailwind.config.js`. Vous pouvez modifier les couleurs et autres variables pour personnaliser l'apparence de l'application.

### API

Les services d'API sont configurés dans le dossier `src/services/`. Vous devrez peut-être ajuster les endpoints et les paramètres pour correspondre à votre API backend.

## Licence

[MIT](LICENSE)
#   c o s m e t e s t _ p o o l  
 