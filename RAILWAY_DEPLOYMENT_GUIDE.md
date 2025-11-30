# 🚀 Guide de Déploiement sur Railway

## Étape 1 : Préparer le Backend

### 1.1 Vérifier la configuration locale
```powershell
cd backend
npm run build
npm start
```
Vous devriez voir : `🚀 APUIC Capital Backend running on port 3000`

### 1.2 Vérifier le Procfile existe
```powershell
Test-Path backend/Procfile
# Doit retourner: True
```

### 1.3 Vérifier les variables d'environnement locales
Créez `backend/.env` avec :
```
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=apuic_capital
NODE_ENV=development
PORT=3000
```

---

## Étape 2 : Configurer Railway Backend

1. **Connectez-vous à Railway** : https://railway.app
2. **Créez un nouveau projet** ou accédez au vôtre
3. **Connectez votre Repository** (GitHub/GitLab)
4. **Sélectionnez la branche** (main)
5. **Configurez le service backend** :
   - **Service name** : `apuic-backend` (ou votre nom)
   - **Root directory** : `backend` (important !)

### 2.1 Ajouter les variables d'environnement

Dans Railway Dashboard > Variables, ajoutez :

```
DB_HOST=your-mysql-railway-host
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=apuic_capital
NODE_ENV=production
PORT=3000
JWT_SECRET=your-jwt-secret-key
```

**⚠️ Pour DB_HOST :** 
- Si vous utilisez MySQL sur Railway, le host ressemble à `railway-project.up.railway.app`
- Si c'est une base distante, utilisez l'URL fournie par votre hébergeur

### 2.2 Vérifier le Procfile
Railway devrait automatiquement détecter et exécuter :
```
web: npm run build && npm start
```

---

## Étape 3 : Configurer le Frontend

### 3.1 Récupérer l'URL du Backend Railway
1. Dans Railway, cliquez sur votre service backend
2. Allez à l'onglet **"Networking"** ou **"Deployments"**
3. Copiez l'URL publique (ex: `https://apuic-backend-prod.railway.app`)

### 3.2 Mettre à jour `.env.railway`
```
VITE_API_URL=https://apuic-backend-prod.railway.app/api
VITE_DEV_AUTO_FILL_OTP=false
```

### 3.3 Créer/Mettre à jour le service Frontend sur Railway
1. **Ajouter un nouveau service** ou configurer le vôtre
2. **Build command** : `npm run build`
3. **Start command** : `npm run preview` (ou servez via `dist/`)
4. **Root directory** : `.` (racine du repo si frontend à la racine)

**OU** si votre frontend et backend sont dans le même repo :
- **Root directory** : `.` (ne pas spécifier)
- **Build command** : `npm run build`
- **Start command** : `npm run preview`

---

## Étape 4 : Tester Après Déploiement

### 4.1 Vérifier le Backend

```bash
# Depuis votre terminal ou Postman
curl https://apuic-backend-prod.railway.app/health
# Réponse attendue: {"status":"ok","timestamp":"2025-11-30T..."}
```

### 4.2 Vérifier la Connexion à la BD

Allez à l'onglet **Logs** du Backend dans Railway :
```
✅ MySQL connection established
🚀 APUIC Capital Backend running on port 3000
```

Si vous voyez :
```
❌ MySQL connection failed
```
Vérifiez les variables `DB_HOST`, `DB_PASSWORD`, etc.

### 4.3 Tester l'API depuis le Frontend

1. Ouvrez le frontend deployé
2. Essayez de vous **inscrire** ou **connecter**
3. Ouvrez la **Console du navigateur** (F12)
4. Recherchez les requêtes vers votre backend
5. Vérifiez qu'elles retournent du JSON (pas du HTML)

---

## 🔧 Troubleshooting

### Erreur : "Cannot find module '/app/dist/index.js'"
**Solution** : Assurez-vous que `backend/Procfile` existe avec le contenu correct et que vous avez mis à jour `package.json` avec le script `start` complet.

### Erreur : "Unexpected token '<', "<!doctype"..."
**Cause** : Le frontend utilise une mauvaise URL pour le backend
**Solution** : 
1. Vérifiez `VITE_API_URL` dans le `.env.railway` du frontend
2. Confirmez que l'URL est accessible : `curl https://votre-backend.railway.app/health`
3. Consultez les logs du navigateur (F12) pour voir quelle URL est utilisée

### Erreur : "MySQL connection failed"
**Cause** : Variables d'environnement manquantes ou incorrectes
**Solution** :
1. Vérifiez `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` dans Railway Dashboard
2. Testez la connexion depuis votre machine locale en remplaçant les variables
3. Assurez-vous que la base MySQL est accessible (pas de firewall)

### Base de données non trouvée
**Cause** : Vous n'avez pas créé la base `apuic_capital` sur votre serveur MySQL
**Solution** :
```sql
CREATE DATABASE apuic_capital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Puis exécutez les migrations :
```bash
# Depuis votre terminal local
cd backend
npm run migrate
```

---

## ✅ Checklist Finale

- [ ] `backend/Procfile` existe et contient `web: npm run build && npm start`
- [ ] `backend/package.json` script `start` = `npm run build && node dist/index.js`
- [ ] Variables d'environnement configurées sur Railway Dashboard
- [ ] Base MySQL créée et accessible depuis Railway
- [ ] `VITE_API_URL` pointe vers l'URL correcte du backend
- [ ] `npm run build` fonctionne localement
- [ ] Les logs Railway du backend montrent "✅ MySQL connection established"
- [ ] Requête `/health` depuis le backend retourne du JSON
- [ ] Frontend peut se connecter/inscrire sans erreur "Unexpected token '<'"

---

## 📞 Besoin d'aide ?

Si vous rencontrez toujours des problèmes, partagez :
1. L'URL complète de votre backend Railway
2. Les logs du backend (onglet Logs dans Railway)
3. L'erreur exacte dans la Console du navigateur (F12)
