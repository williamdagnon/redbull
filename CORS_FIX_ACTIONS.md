# 🔧 Correction CORS - Actions Immédiates

## Erreur Rencontrée
```
Access to fetch at 'https://redbull-production.up.railway.app/api/auth/login' 
blocked by CORS policy
```

## ✅ Ce qui a été corrigé

### 1. Backend (src/index.ts)
- ✅ Configuration CORS mise à jour
- ✅ Ajout de domaines autorisés (localhost + Railway)
- ✅ Support de `FRONTEND_URL` depuis les variables d'environnement

### 2. Variables d'environnement
- ✅ `.env.railway.example` - Ajout de `FRONTEND_URL`
- ✅ `.env.railway` - URL backend actualisée

---

## 🚀 Actions à Faire sur Railway Dashboard

### Étape 1 : Allez sur Railway Dashboard
- https://railway.app → Votre projet → Backend Service (redbull-production)

### Étape 2 : Ajoutez/Mettez à jour les Variables

Dans l'onglet **Variables**, assurez-vous d'avoir :

```
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=apuic_capital
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://tender-charm-production-865b.up.railway.app
JWT_SECRET=your-jwt-secret
ENABLE_CRON_JOBS=true
```

**Important** : `FRONTEND_URL` doit être exactement :
```
https://tender-charm-production-865b.up.railway.app
```

### Étape 3 : Redéployez le Backend

1. Allez à l'onglet **Deployments**
2. Cliquez sur **Redeploy** (ou attendez un auto-redeploy après avoir changé les variables)
3. Attendez le message ✅ "Deployment Successful"

### Étape 4 : Testez

1. Ouvrez votre frontend : `https://tender-charm-production-865b.up.railway.app`
2. Essayez de vous **Connecter** ou **Inscrire**
3. L'erreur CORS ne devrait plus apparaître

---

## 🧪 Vérification

Ouvrez la Console du navigateur (F12) et vérifiez :

### ✅ Avant (Erreur)
```
Access to fetch blocked by CORS policy
No 'Access-Control-Allow-Origin' header
```

### ✅ Après (Success)
- La requête POST vers `/api/auth/login` réussit
- Pas d'erreur CORS dans la console
- Vous voyez une réponse JSON (pas HTML)

---

## ❓ Si l'erreur persiste

### Vérification rapide
```powershell
# Testez directement l'API
curl -X OPTIONS https://redbull-production.up.railway.app/api/health `
  -H "Origin: https://tender-charm-production-865b.up.railway.app" `
  -H "Access-Control-Request-Method: GET" -v
```

Vous devriez voir :
```
< Access-Control-Allow-Origin: https://tender-charm-production-865b.up.railway.app
```

### Solutions alternatives si le problème persiste

**Option 1 : CORS Permissif (Développement Uniquement)**
```typescript
// Dans backend/src/index.ts
app.use(cors({ origin: '*' }));
```
⚠️ **Ne faites cela QUE si vous comprenez les risques de sécurité !**

**Option 2 : Utiliser un reverse proxy**
- Servir le frontend et le backend depuis le même domaine
- Configurer Railway pour un seul service

---

## 📝 Checklist

- [ ] `FRONTEND_URL` ajoutée aux variables Railway du backend
- [ ] Backend redeployé après le changement de variables
- [ ] Pas d'erreur CORS dans la console (F12)
- [ ] Requête POST `/api/auth/login` retourne du JSON
- [ ] Inscription/Connexion fonctionne
