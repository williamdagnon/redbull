# 🚀 Guide de Déploiement et Test Local

## 📋 Prérequis

- Node.js 16+ installé
- MySQL 8.0+ en cours d'exécution
- Base de données créée: `apuic_capital`
- JWT_SECRET configuré dans .env (backend)
- Port 5000 (backend) et 5173 (frontend) disponibles

---

## 🏗️ Installation et Setup

### 1. Backend Setup

```powershell
# Naviguer vers le backend
cd E:\PROJ\new_project\new\backend

# Installer les dépendances
npm install

# Vérifier que TypeScript n'a pas d'erreurs
npm run build

# Démarrer le serveur en développement
npm run dev
```

**Output attendu:**
```
Server running on port 5000
Database connected
```

---

### 2. Frontend Setup

```powershell
# Naviguer vers le frontend (root du projet)
cd E:\PROJ\new_project\new

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

**Output attendu:**
```
VITE v4.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

---

## 🧪 Tests Locaux

### 1. Test TypeScript Complet

```powershell
# Frontend - Vérifier les erreurs TypeScript
cd E:\PROJ\new_project\new
npm run build

# Backend - Vérifier les erreurs TypeScript
cd E:\PROJ\new_project\new\backend
npm run build

# Ou si `build` n'existe pas, utiliser:
npx tsc --noEmit
```

**Si erreurs:**
- Corriger les fichiers signalés
- Les erreurs les plus courantes: `any`, unused variables, missing types

---

### 2. Test du Flux Frontend Complet

#### A. Préparation

```bash
# 1. Vérifier que les payment_methods existent en DB
# Ouvrir MySQL Workbench ou terminal:
mysql> SELECT * FROM payment_methods WHERE is_active = 1;
```

Si aucun résultat, créer une méthode:

```sql
INSERT INTO payment_methods (id, code, name, account_number, account_holder_name, min_deposit, is_active)
VALUES (UUID(), 'TEST_BANK', 'Bank Transfer', '0011222333', 'Company Ltd', 1000, 1);
```

#### B. Navigation

1. Ouvrir http://localhost:5173
2. Connexion utilisateur
3. Aller au Dashboard
4. Cliquer sur "Recharge" ou "Dépôt"

#### C. Remplir le Formulaire

```
1. RechargePage:
   - Montant: 10000
   - Sélectionner: Bank Transfer
   - Cliquer "Démarrer le paiement"

2. Payment Étape 1:
   - Numéro mobile: 95123456
   - Cliquer "Suivant"

3. Payment Étape 2 ⭐:
   - Vérifier: Titulaire "Company Ltd" s'affiche
   - Vérifier: Numéro "0011222333" s'affiche
   - Saisir ID de transfert: 123456789
   - Cliquer "Suivant"

4. Payment Étape 3:
   - Vérifier récap (mobile + ID transfer)
   - Cliquer "Soumettre"

5. Résultat:
   - Doit voir message "Dépôt soumis avec succès"
   - Redirection vers Dashboard après ~1.5s
```

---

### 3. Test Backend via curl (PowerShell)

#### A. Créer un dépôt via API

```powershell
# 1. Se connecter et récupérer le token
$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"phone": "95123456", "password": "your_password"}' `
  -Headers @{"Authorization" = "Bearer"}

$token = ($loginResponse | ConvertFrom-Json).token

# 2. Appeler POST /recharge
$rechargeBody = @{
  amount = 10000
  pay_way_id = "uuid-payment-method"  # Remplacer par l'UUID réel
  transfer_id = "123456789"
  customer_mobile = "95123456"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/recharge" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"Authorization" = "Bearer $token"} `
  -Body $rechargeBody

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Output attendu:**
```json
{
  "status": 1,
  "msg": "Dépôt créé et en attente d'approbation",
  "result": {
    "depositId": "uuid-...",
    "orderCode": "I1700000000000"
  }
}
```

---

### 4. Vérifier la Base de Données

```powershell
# Connexion MySQL
mysql -u root -p apuic_capital

# Vérifier les dépôts créés
SELECT * FROM deposits ORDER BY created_at DESC LIMIT 5;

# Afficher les colonnes importantes
SELECT 
  id, 
  user_id, 
  amount, 
  payment_method, 
  account_number, 
  transfer_id, 
  status 
FROM deposits 
ORDER BY created_at DESC 
LIMIT 1;

# Doit afficher:
# - account_number: 95123456 (numéro mobile saisi)
# - transfer_id: 123456789 (ID saisi)
# - status: pending
```

---

### 5. Test Approbation Admin

```powershell
# En admin panel ou via admin API:
# PATCH /admin/deposits/{depositId}/approve

$approveBody = @{
  admin_notes = "Approuvé - transfert confirmé"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/admin/deposits/{depositId}/approve" `
  -Method PATCH `
  -ContentType "application/json" `
  -Headers @{"Authorization" = "Bearer $admin_token"} `
  -Body $approveBody

# Vérifier le changement
SELECT * FROM deposits WHERE id = 'uuid-deposit';
# status doit être 'approved'

# Vérifier le portefeuille
SELECT balance FROM wallets WHERE user_id = 'user-id';
# balance doit avoir augmenté de 10000
```

---

## 📊 Monitoring et Debugging

### Console DevTools Frontend

```javascript
// Vérifier le token
console.log(localStorage.getItem('token'));

// Voir la requête qui sera envoyée
fetch('http://localhost:5000/api/recharge', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    amount: 10000,
    pay_way_id: 'uuid',
    transfer_id: '123456789',
    customer_mobile: '95123456'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

### Logs Backend

```powershell
# Dans le terminal du backend (npm run dev)
# Vous devriez voir:
# POST /api/recharge 200 OK
# Dépôt créé: [depositId]

# Si erreur:
# POST /api/recharge 400 Bad Request
# Erreur: [message]
```

---

## 🔍 Tests Spécifiques

### Test 1: Validation Montant Minimum

```powershell
# Essayer un montant trop bas (< minDeposit)
$body = @{
  amount = 100  # Si minDeposit = 1000
  pay_way_id = "uuid"
  transfer_id = "123"
  customer_mobile = "95"
} | ConvertTo-Json

# Doit retourner: 
# status: 0
# msg: "Minimum deposit is 1000"
```

---

### Test 2: Validation ID de Transfert (Frontend)

```javascript
// Dans DevTools de Payment Étape 2:

// Test: moins de 9 chiffres
const input = document.querySelector('input[placeholder="ID de transfert"]');
input.value = '12345678';  // 8 chiffres
// Cliquer "Suivant" → doit afficher "ID de transfert invalide !"

// Test: exactement 9 chiffres
input.value = '123456789';
// Cliquer "Suivant" → doit passer ✓
```

---

### Test 3: Validation Numéro Mobile (Frontend)

```javascript
// Dans DevTools de Payment Étape 1:

// Test: moins de 8 chiffres
const mobileInput = document.querySelector('input[placeholder="XXXXXXXX"]');
mobileInput.value = '9512345';  // 7 chiffres
// Cliquer "Suivant" → doit afficher "Numéro invalide !"

// Test: exactement 8 chiffres
mobileInput.value = '95123456';
// Cliquer "Suivant" → doit passer ✓
```

---

### Test 4: Erreur de Connexion

```powershell
# Nettoyer les données de session
Remove-Item -Path "$env:APPDATA\Local\..\Local\Google\Chrome\User Data\Default\Local Storage" -Recurse -Force

# Puis relancer et tester l'authentification
```

---

## 📈 Performance & Load Testing

### Test 1: Vitesse Frontend

```javascript
// Dans DevTools Console:
performance.mark('start-recharge');

// ... faire le flux ...

performance.mark('end-recharge');
performance.measure('recharge-flow', 'start-recharge', 'end-recharge');
console.log(performance.getEntriesByName('recharge-flow')[0]);
// Doit être < 2 secondes
```

### Test 2: API Response Time

```powershell
# Mesurer le temps de réponse POST /recharge
time curl -X POST http://localhost:5000/api/recharge `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{"amount": 10000, ...}'

# Doit être < 500ms
```

---

## 🚨 Troubleshooting

### Problème: "Cannot find module api.getPaymentMethods"

**Solution:**
```typescript
// Vérifier que api.ts a la méthode:
export async function getPaymentMethods() {
  return get('/deposits/payment-methods');
}

// Sinon l'ajouter
```

---

### Problème: "POST /recharge returns 401"

**Solution:**
```powershell
# Vérifier que:
# 1. Token est valide
console.log(localStorage.getItem('token'));

# 2. Backend a l'endpoint en route
# grep -n "router.post.*recharge" backend/src/routes/recharge.routes.ts

# 3. Route est enregistrée dans index.ts
# grep -n "use.*recharge" backend/src/index.ts
```

---

### Problème: "Database error: Unknown column transfer_id"

**Solution:**
```sql
-- Vérifier que la colonne existe
DESCRIBE deposits;

-- Si elle n'existe pas, l'ajouter:
ALTER TABLE deposits ADD COLUMN transfer_id VARCHAR(255);

-- Vérifier le schéma actuel
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'deposits';
```

---

### Problème: TypeScript erreurs "Unexpected any"

**Solution:**
```typescript
// Remplacer:
const methods: any[] = [];

// Par:
interface PaymentMethod {
  id?: string;
  name?: string;
  account_number?: string;
  account_holder_name?: string;
}

const methods: PaymentMethod[] = [];
```

---

## ✅ Checklist de Déploiement

- [ ] Backend compiles sans erreurs
- [ ] Frontend compiles sans erreurs
- [ ] Payment_methods table a au moins 1 entrée active
- [ ] payment_methods ont account_holder_name et account_number remplis
- [ ] POST /recharge créée des deposits avec transfer_id
- [ ] Frontend affiche titulaire et numéro de compte
- [ ] Admin peut approuver les dépôts
- [ ] Portefeuille se met à jour après approbation
- [ ] Pas d'erreur 401/403 non gérée
- [ ] Responsive sur mobile

---

## 🎯 Prochaines Étapes Après Tests

1. **Déploiement Staging**
   ```bash
   # Build pour production
   npm run build
   
   # Déployer sur serveur staging
   scp -r dist/* staging:/var/www/app/
   ```

2. **Intégration Payment Provider**
   - Si Inpay: configurer INPAY_SECRET
   - Tester les callbacks
   - Vérifier la signature HMAC

3. **Email Notifications**
   - Envoyer email à l'utilisateur: "Dépôt soumis"
   - Envoyer email à l'admin: "Nouveau dépôt à approuver"

4. **Audit & Logging**
   - Vérifier que activity_logs enregistre les dépôts
   - Vérifier que admin actions sont loggées

---

## 📞 Support

Pour toute erreur:
1. Vérifier les logs (terminal backend)
2. Vérifier la console DevTools (frontend)
3. Vérifier la base de données (MySQL)
4. Vérifier les fichiers modifiés (.tsx, .ts)

Fichiers clés:
- Frontend: `src/components/RechargePage.tsx`, `src/components/Payment.tsx`
- Backend: `backend/src/routes/recharge.routes.ts`, `backend/src/index.ts`
- Database: `backend/src/db/schema.mysql.sql`, `payment_methods_additions_mysql.sql`
