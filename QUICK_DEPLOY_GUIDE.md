# 🚀 Guide de Déploiement Rapide

**Date:** 28 novembre 2025  
**Temps estimé:** 30 minutes  
**Prérequis:** Node.js, PostgreSQL

---

## ⚡ Déploiement Local (5 min)

### 1. Appliquer la Migration DB

```bash
# Terminal 1: PostgreSQL
cd backend/src/db

# Via psql
psql -U postgres -d your_database -f add_ussd_code.sql

# OU via l'app si vous avez un script de migration
npm run migrate
```

**Vérification:**
```sql
-- Connecté à PostgreSQL
\d payment_methods;
-- Doit voir colonne: ussd_code | character varying(50)

SELECT ussd_code FROM payment_methods LIMIT 3;
-- Doit voir: *145#, *155#, *145#, etc.
```

---

### 2. Frontend Build

```bash
# Terminal 2: Frontend
cd /workspace

# Vérifier les erreurs TypeScript
npm run build

# Expected: ✅ All files compiled successfully
```

---

### 3. Backend Start

```bash
# Terminal 3: Backend
cd backend

npm run dev
# Expected: ✅ Server running on http://localhost:3000
```

---

### 4. Frontend Dev Server

```bash
# Terminal 4: Frontend (ou Vite)
npm run dev

# Expected: ✅ Local: http://localhost:5173
```

---

## 🧪 Test Local Flow (10 min)

### Étape 1: Login
- Accéder à `http://localhost:5173`
- Login avec compte test
- Dashboard visible ✅

### Étape 2: Accéder Recharge
- Cliquer sur "Recharge" ou "Dépôt"
- Page RechargePage affichée ✅
- Voir les payment methods chargées ✅

### Étape 3: Sélectionner Montant + Méthode
```
- Entrer montant: 5000
- Sélectionner méthode: "TMoney" (ou autre)
- Cliquer "Démarrer le paiement"
```

**Expected:**
- Payment component affiché
- Étape 1: formulaire mobile visible

### Étape 4: Étape 1 - Mobile

```
✅ Affiche: "Montant : 5000 XOF"
✅ Affiche: "Minimum requis : 1000 XOF"
✅ Affiche: "✓ Montant valide"
✅ Input mobile visible
✅ Placeholder: "Exemple: 95123456"
✅ Texte: "Sans le code pays (229)"
```

**Tests:**
- Entrer "95123" (5 chiffres)
  - Cliquer "Suivant"
  - Expected: ❌ "Numéro invalide ! (6-8 chiffres)"

- Entrer "95123456" (8 chiffres)
  - Cliquer "Suivant"
  - Expected: ✅ Avance à Étape 2

### Étape 5: Étape 2 - Compte + USSD

```
✅ Affiche: "Titulaire du compte :" + nom
✅ Affiche: "Numéro de compte :" + numéro
   - Avec bordure rouge ✅
   - Bouton "Copier" ✅
✅ Affiche: "Code USSD :" + code
   - Avec bordure rouge ✅
   - Bouton "Copier" ✅
✅ Affiche: "ID de transfert" + input
   - Avec bordure rouge ✅
```

**Tests:**
- Cliquer "Copier" sur numéro compte
  - Expected: Message "Copié !"
  - Coller: numéro correct pâte ✅

- Cliquer "Copier" sur code USSD
  - Expected: Message "Copié !"
  - Code USSD est configurable (du backend)

- Entrer ID transfert: "12345678" (8 chiffres)
  - Cliquer "Suivant"
  - Expected: ❌ "ID de transfert invalide !"

- Entrer ID transfert: "123456789" (9 chiffres)
  - Cliquer "Suivant"
  - Expected: ✅ Avance à Étape 3

### Étape 6: Étape 3 - Récapitulatif

```
✅ Affiche: "Récapitulatif du dépôt :"
✅ Affiche: "Montant : 5000 XOF"
✅ Affiche: "Numéro mobile : +229 95123456"
✅ Affiche: "Compte bénéficiaire : {account}"
✅ Affiche: "ID de transfert : 123456789"
✅ Message: "Vérifiez... Soumettre pour approbation"
✅ Bouton: "Soumettre" visible
```

**Tests:**
- Cliquer "Précédent"
  - Expected: Retour Étape 2 ✅
- Cliquer "Suivant" depuis Étape 2
  - Expected: Retour Étape 3 ✅

### Étape 7: Soumettre

- Cliquer "Soumettre"
  - Expected: Bouton devient "Envoi..." ✅
  - Expected: Message "✓ Dépôt soumis pour approbation"
  - Expected: Après 1.5s → Redirect home + ?deposit_success=1

---

## 🗄️ Vérifications Database

```sql
-- 1. Vérifier migration appliquée
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_methods' AND column_name = 'ussd_code';
-- Expected: ussd_code | character varying

-- 2. Vérifier codes USSD peuplés
SELECT id, name, ussd_code, min_deposit 
FROM payment_methods 
WHERE is_active = true;
-- Expected:
-- | id | name | ussd_code | min_deposit |
-- | uuid | TMoney | *145# | 1000 |
-- | uuid | MOOV | *155# | 1000 |

-- 3. Vérifier dépôt créé (après submit frontend)
SELECT id, user_id, amount, status, transfer_id, account_number 
FROM deposits 
ORDER BY created_at DESC 
LIMIT 1;
-- Expected:
-- | id | user_id | 5000 | pending | 123456789 | 95123456 |

-- 4. Vérifier transaction liée
SELECT id, user_id, type, amount, status, reference_id 
FROM transactions 
WHERE reference_id = (SELECT id FROM deposits ORDER BY created_at DESC LIMIT 1);
-- Expected:
-- | id | user_id | deposit | 5000 | pending | {depositId} |

-- 5. Wallet NON crédité (car pending)
SELECT id, balance 
FROM wallets 
WHERE user_id = {userId};
-- Expected: balance inchangée (pas +5000 encore)
```

---

## 🚨 Troubleshooting

### Problème: "Migration file not found"
```bash
# Solution
cd backend/src/db
ls -la add_ussd_code.sql
# Should list the file

# If not there, verify you created it:
# backend/src/db/add_ussd_code.sql must exist
```

### Problème: "Column ussd_code does not exist"
```bash
# Solution: Migration pas appliquée
psql -U postgres -d your_db

# Vérifier si migration existe
SELECT * FROM information_schema.columns 
WHERE table_name = 'payment_methods';

# Si ussd_code pas là, appliquer:
\i backend/src/db/add_ussd_code.sql

# Vérifier après
SELECT ussd_code FROM payment_methods LIMIT 1;
```

### Problème: TypeScript errors au build
```bash
# Solution
npm run build
# Fix any errors in:
# - src/components/Payment.tsx
# - src/components/RechargePage.tsx
# - backend/src/routes/recharge.routes.ts

# After fixes:
npm run build  # Should succeed with 0 errors
```

### Problème: Frontend ne reçoit pas USSD code
```bash
# Vérifier RechargePage.tsx passe la prop
# src/components/RechargePage.tsx ligne ~63-70
ussdCode={selectedMethod?.ussd_code || ''}
minDeposit={selectedMethod?.min_deposit ? Number(selectedMethod.min_deposit) : 1000}

# Vérifier Payment.tsx reçoit la prop
# src/components/Payment.tsx ligne ~16-17
ussdCode?: string;
minDeposit?: number;

# Et déstructure:
// src/components/Payment.tsx ligne ~20-27
ussdCode: initialUssdCode,
minDeposit: initialMinDeposit
}) => {
```

### Problème: Mobile 6-8 chiffres non respecté
```bash
# Vérifier validation frontend
# src/components/Payment.tsx ligne ~54
if (!/^\d{6,8}$/.test(customerMobile)) {

# Vérifier filter en input (retire non-digits)
# src/components/Payment.tsx ligne ~110
onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}

# Vérifier backend aussi
# backend/src/routes/recharge.routes.ts ligne ~25
if (!customer_mobile || !/^\d{6,8}$/.test(String(customer_mobile))) {
```

---

## 📋 Checklist Déploiement

- [ ] Branche main clean (git status = clean)
- [ ] Migration DB appliquée
  ```bash
  psql -U postgres -d db -f backend/src/db/add_ussd_code.sql
  ```
- [ ] payment_methods.ussd_code peuplée
  ```sql
  SELECT COUNT(*) FROM payment_methods WHERE ussd_code IS NOT NULL;
  -- Should be > 0
  ```
- [ ] npm run build (frontend) = 0 errors
- [ ] Backend running (npm run dev)
- [ ] Frontend dev server (npm run dev)
- [ ] Test login
- [ ] Test full recharge flow
- [ ] Vérifier DB: deposits créé avec status='pending'
- [ ] Vérifier DB: transfer_id stocké
- [ ] Vérifier DB: account_number = mobile user
- [ ] Redirect works (?deposit_success=1)

---

## 🌐 Déploiement Production

### Préparation

```bash
# 1. Tests
npm run test  # If you have tests

# 2. Build frontend
npm run build
# Output: dist/ folder

# 3. Build backend
cd backend
npm run build
# Output: dist/ folder
```

### Déploiement

**Frontend:**
```bash
# Deploy dist/ to your hosting:
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
# - Your own server

# Update .env for production API URL
VITE_API_URL=https://api.yourdomain.com
```

**Backend:**
```bash
# Deploy to your server:
# - Docker
# - Heroku
# - AWS EC2
# - DigitalOcean
# - Your own server

# Ensure:
# - PostgreSQL migrated (add_ussd_code.sql)
# - .env configured (DB connection, JWT secret, etc.)
# - npm run dev or PM2 / Docker running
```

### Post-Déploiement

```bash
# Vérifier endpoints actifs
curl https://api.yourdomain.com/api/recharge \
  -H "Authorization: Bearer {token}" \
  -d '{"amount": 5000, ...}'
```

---

## 📞 Support

### Logs Frontend (Browser DevTools)
```javascript
// Console tab
// Should see no errors
// Should see API responses

// Application tab
// Storage → LocalStorage
// Should see: token, user data
```

### Logs Backend
```bash
# Terminal where backend running
# Should see: "Recharge request received"
# Should see: "Deposit created: {depositId}"
# Should see: "HTTP 200 OK" responses
```

### Logs Database
```bash
# PostgreSQL logs
tail -f /var/log/postgresql/postgresql.log

# Or in psql
SELECT * FROM pg_stat_statements LIMIT 5;
```

---

## ✅ Fait !

You're now ready to deploy! 🎉

**Prochaines étapes:**
1. Test en production
2. Admin approves deposits
3. User wallets credited
4. Done! 🚀

---

**Besoin d'aide?** Vérifiez `CHECKLIST_UPDATES.md` et `TESTS_API_EXAMPLES.md`
