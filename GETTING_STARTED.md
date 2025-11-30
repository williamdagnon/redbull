# 🚀 Getting Started Checklist - Démarrer Immédiatement

## ⏱️ Temps Total: 1-2 heures

```
⌚ 5 min  : Lire ce fichier
⌚ 10 min : Revue rapide du code
⌚ 10 min : Setup local backend
⌚ 10 min : Setup local frontend
⌚ 20 min : Test du flux complet
⌚ 20 min : Vérification DB
```

---

## ✅ Étape 1: Lire la Vue d'Ensemble (5 min)

**Lisez ce qui a été implémenté:**

```
RechargePage.tsx
├─ ✅ Bouton retour (◀) en haut à gauche
├─ ✅ Charge payment_methods du backend
└─ ✅ Affiche numéro de compte pour chaque méthode

Payment.tsx - Étape 2
├─ ✅ Cadre rouge: Titulaire du compte
├─ ✅ Cadre rouge: Numéro de compte
├─ ✅ Cadre rouge: ID de transfert (input obligatoire)
└─ ✅ Validation: 9-11 chiffres requis

Backend POST /recharge
├─ ✅ Accepte transfer_id et customer_mobile
├─ ✅ Crée deposits avec transfer_id stocké
├─ ✅ Retourne succès (pas redirection /inpay)
└─ ✅ Redirection user vers Dashboard

Database
├─ ✅ deposits.transfer_id rempli
├─ ✅ deposits.account_number = mobile user
└─ ✅ Admin peut approuver et créditer
```

---

## ✅ Étape 2: Revue Rapide du Code (10 min)

### Frontend - Fichiers à Vérifier

#### A. `src/components/RechargePage.tsx`
```typescript
// ✅ Ces lignes doivent exister:

// Interface type pour payment methods
interface PaymentMethod {
  id?: string;
  account_number?: string;
  account_holder_name?: string;
}

// Charger les méthodes du backend
const resp = await api.getPaymentMethods() as { success: boolean; data: PaymentMethod[] };

// Trouver la méthode sélectionnée
const selectedMethod = methods.find((m: PaymentMethod) => String(m.id ?? m.name) === String(payWay));

// Passer à Payment
<Payment 
  amount={amount} 
  payWay={payWay} 
  accountNumber={selectedMethod?.account_number} 
  accountHolderName={selectedMethod?.account_holder_name} 
/>

// Bouton retour
<button onClick={goToDashboard} className="text-2xl font-bold">◀</button>
```

**Quick Check:**
```bash
grep -n "accountNumber" src/components/RechargePage.tsx
grep -n "goToDashboard" src/components/RechargePage.tsx
grep -n "PaymentMethod" src/components/RechargePage.tsx
```

---

#### B. `src/components/Payment.tsx`
```typescript
// ✅ Ces lignes doivent exister:

// Props reçues
interface PaymentProps {
  amount?: number;
  payWay?: string | number | null;
  accountNumber?: string;
  accountHolderName?: string;
}

// Afficher titulaire en cadre rouge (Étape 2)
<div className="border-2 border-red-500 p-4 rounded mb-4">
  <p className="text-lg font-bold text-red-600">{accountHolderName}</p>
</div>

// Afficher compte en cadre rouge (Étape 2)
<div className="border-2 border-red-500 p-4 rounded mb-4">
  <p className="text-xl font-bold text-red-600">{account}</p>
</div>

// ID de transfert en cadre rouge (Étape 2)
<div className="border-2 border-red-500 p-4 rounded mt-6">
  <input type="text" value={transferId} onChange={(e) => setTransferId(e.target.value)} />
</div>

// Soumettre (Étape 3)
const payload = {
  amount,
  pay_way_id: payWay,
  transfer_id: transferId,
  customer_mobile: customerMobile
};
```

**Quick Check:**
```bash
grep -n "border-red-500" src/components/Payment.tsx
grep -n "transfer_id:" src/components/Payment.tsx
grep -n "customer_mobile:" src/components/Payment.tsx
```

---

### Backend - Fichiers à Vérifier

#### C. `backend/src/routes/recharge.routes.ts`
```typescript
// ✅ Ces lignes doivent exister:

// Accepter les nouveaux paramètres
const { amount, pay_way_id, transfer_id, customer_mobile } = req.body;

// Insérer avec transfer_id
await execute(
  `INSERT INTO deposits (..., transfer_id, ...) VALUES (..., $7, ...)`,
  [..., transfer_id || '', ...]
);

// Retourner succès
return res.json({
  status: 1,
  msg: 'Dépôt créé et en attente d\'approbation',
  result: { depositId, orderCode }
});
```

**Quick Check:**
```bash
grep -n "transfer_id" backend/src/routes/recharge.routes.ts
grep -n "customer_mobile" backend/src/routes/recharge.routes.ts
grep -n "pending" backend/src/routes/recharge.routes.ts
```

---

## ✅ Étape 3: Setup Local - Backend (10 min)

### 3A. Installer Backend

```powershell
# Terminal 1 - Backend
cd E:\PROJ\new_project\new\backend
npm install
npm run dev

# ✅ Doit afficher:
# Server running on port 5000
# Database connected
```

**Vérifier:**
- [ ] Pas d'erreurs TypeScript
- [ ] Server démarre sur port 5000
- [ ] Database connectée

---

### 3B. Créer Payment Method en DB

```powershell
# Terminal 2 - MySQL
mysql -u root -p apuic_capital

# OU via GUI MySQL Workbench:
# Créer une nouvelle payment method:

INSERT INTO payment_methods 
(id, code, name, account_number, account_holder_name, min_deposit, is_active)
VALUES 
(UUID(), 'TEST_BANK', 'Bank Transfer', '0011222333', 'Company Ltd', 1000, 1);

# Vérifier:
SELECT * FROM payment_methods WHERE is_active = 1;
```

**Expected Output:**
```
id: uuid-xxx
code: TEST_BANK
name: Bank Transfer
account_number: 0011222333
account_holder_name: Company Ltd
min_deposit: 1000
is_active: 1
```

---

## ✅ Étape 4: Setup Local - Frontend (10 min)

### 4A. Installer Frontend

```powershell
# Terminal 3 - Frontend
cd E:\PROJ\new_project\new
npm install
npm run dev

# ✅ Doit afficher:
# VITE v4.x.x ready in XXX ms
# Local: http://localhost:5173/
```

**Vérifier:**
- [ ] Pas d'erreurs TypeScript
- [ ] Frontend démarre sur port 5173
- [ ] App charges correctement

---

### 4B. Vérifier les Fichiers Modifiés

```bash
# Vérifier les fichiers existent et sont modifiés
ls -la src/components/RechargePage.tsx
ls -la src/components/Payment.tsx

# Vérifier pas de syntaxe error (DevTools console)
# Ouvrir http://localhost:5173
# Appuyer F12 → Console → Pas d'erreur rouge
```

---

## ✅ Étape 5: Test du Flux Complet (20 min)

### 5A. Naviguer et Tester

```
1. Ouvrir http://localhost:5173
   ↓
2. Se connecter avec un compte de test
   ↓
3. Aller au Dashboard
   ↓
4. Cliquer sur "Recharge" ou "Dépôt"
   ↓
5. ✅ Vous devriez voir:
   - Titre "Recharge"
   - Bouton ◀ en haut à gauche
   - Input montant
   - Boutons montants rapides
   - Radio méthode de paiement
   - Affichage: "Compte: 0011222333"
```

**Quick Check - RechargePage:**
- [ ] Bouton ◀ présent
- [ ] Clique ◀ → retour Dashboard
- [ ] Input montant: 10000
- [ ] Méthode "Bank Transfer" cochée
- [ ] Numéro "0011222333" visible

---

### 5B. Démarrer le Paiement

```
6. Saisir montant: 10000
   ↓
7. Cliquer "Démarrer le paiement"
   ↓
8. ✅ Vous devriez voir Payment - Étape 1:
   - Montant en haut: "10,000 XOF"
   - Wizard: ① (vert) ▶ ② (gris) ▶ ③ (gris)
   - Input: "+229 [_____]"
   - Message vert
   - Boutons: "Suivant"
```

**Quick Check - Payment Étape 1:**
- [ ] Montant affiché
- [ ] Wizard correct
- [ ] Input mobile

---

### 5C. Saisir Mobile

```
9. Saisir: 95123456 (8 chiffres)
   ↓
10. Cliquer "Suivant"
    ↓
11. ✅ Vous devriez voir Payment - Étape 2:
    - Wizard: ① (gris) ▶ ② (vert) ▶ ③ (gris)
    
    CADRES ROUGES ⭐:
    - "Titulaire du compte: Company Ltd"
    - "Numéro de compte: 0011222333"
    - "Entrez l'ID de transfert: [_____]"
    
    Autres:
    - Code USSD avec "Copier"
    - Lien "Allez payer"
    - Boutons: "< Précédent" et "Suivant"
```

**Quick Check - Payment Étape 2:**
- [ ] Titulaire "Company Ltd" en rouge
- [ ] Compte "0011222333" en rouge
- [ ] ID de transfert input en rouge
- [ ] Boutons "Copier" fonctionnent (toast "Copié !")

---

### 5D. Saisir ID de Transfert

```
12. Essayer "123456" (6 chiffres)
    ↓
13. Cliquer "Suivant"
    ↓
14. ✅ Message d'erreur: "ID de transfert invalide !"
    ↓
15. Saisir "123456789" (9 chiffres)
    ↓
16. Cliquer "Suivant"
    ↓
17. ✅ Vous devriez voir Payment - Étape 3:
    - Wizard: ① ▶ ② ▶ ③ (vert)
    - Récap: "Numéro mobile: +229 95123456"
    - Récap: "ID de transfert: 123456789"
    - Boutons: "< Précédent" et "Soumettre"
```

**Quick Check - Payment Étape 3:**
- [ ] Validation ID transfer fonctionne
- [ ] Récap correct
- [ ] Bouton "Soumettre" visible

---

### 5E. Soumettre

```
18. Cliquer "Soumettre"
    ↓
19. ✅ Doit voir:
    - Message: "Dépôt soumis avec succès pour approbation"
    - Après ~1.5s: Redirection vers Dashboard
    
20. ✅ DevTools Console (F12):
    - POST /recharge 200 OK
    - Payload reçu: {amount, pay_way_id, transfer_id, customer_mobile}
    - Response: {status: 1, result: {depositId, orderCode}}
```

**Quick Check - Soumettre:**
- [ ] Message succès affiché
- [ ] Redirection Dashboard après 1.5s
- [ ] Pas d'erreur 401/500 en console

---

## ✅ Étape 6: Vérifier Database (20 min)

### 6A. Vérifier Dépôt Créé

```powershell
# Terminal MySQL
mysql -u root -p apuic_capital

# Voir les dépôts créés
SELECT * FROM deposits ORDER BY created_at DESC LIMIT 1;
```

**Expected:**
```
id: uuid-deposit
user_id: votre-user-id
amount: 10000
payment_method: Bank Transfer
account_number: 95123456         ← Mobile saisi! ✅
transaction_id: I1700000000000
transfer_id: 123456789          ← ID saisi! ✅
status: pending                 ← En attente approbation ✅
is_first_deposit: 1
```

**Quick Check - DB:**
- [ ] Dépôt existe
- [ ] account_number = mobile saisi (95123456)
- [ ] transfer_id = ID saisi (123456789)
- [ ] status = pending

---

### 6B. Vérifier Transaction

```sql
SELECT * FROM transactions 
WHERE reference_id = 'uuid-deposit-du-dessus'
LIMIT 1;
```

**Expected:**
```
id: uuid-transaction
user_id: votre-user-id
type: deposit
amount: 10000
status: pending
description: Inpay deposit - I1700000000000
reference_id: uuid-deposit
```

**Quick Check - Transaction:**
- [ ] Transaction créée
- [ ] Status = pending
- [ ] reference_id pointe vers le dépôt

---

## ✅ Étape 7: Test Admin Approbation (10 min)

### 7A. Admin Approuve Dépôt

```
1. Se connecter en tant qu'admin
2. Aller à AdminDashboard
3. Voir section "Dépôts en Attente"
4. Voir le dépôt créé (10,000 FCFA, 123456789)
5. Cliquer "Approuver"
6. ✅ Dépôt status change en "APPROVED"
```

**Quick Check - Admin:**
- [ ] Dépôt visible en tant qu'admin
- [ ] Infos correctes affichées
- [ ] Bouton "Approuver" fonctionne

---

### 7B. Vérifier Crédits Portefeuille

```powershell
# Terminal MySQL
mysql -u root -p apuic_capital

# Voir le portefeuille
SELECT * FROM wallets WHERE user_id = 'votre-user-id';
```

**Expected:**
```
balance: +10000 (comparé à avant)
total_invested: 10000
```

**Quick Check - Wallet:**
- [ ] Balance augmentée de 10000
- [ ] total_invested augmentée de 10000

---

## ✅ Vérification Finale - Checklist

### Frontend
- [ ] RechargePage a bouton retour ◀
- [ ] RechargePage affiche numéro de compte
- [ ] Payment Étape 2 affiche titulaire en rouge
- [ ] Payment Étape 2 affiche compte en rouge
- [ ] Payment Étape 2 a champ ID de transfert en rouge
- [ ] Validation ID transfer (9-11 chiffres) fonctionne
- [ ] Message succès s'affiche
- [ ] Redirection Dashboard fonctionne

### Backend
- [ ] POST /recharge accepte transfer_id
- [ ] POST /recharge accepte customer_mobile
- [ ] Dépôt créé avec transfer_id rempli
- [ ] Dépôt créé avec account_number rempli
- [ ] Retourne status 1 (succès)
- [ ] Pas d'erreur 500

### Database
- [ ] deposits.transfer_id rempli
- [ ] deposits.account_number rempli
- [ ] deposits.status = pending
- [ ] transactions créée et liée
- [ ] Admin peut approuver
- [ ] Portefeuille se met à jour

### TypeScript
- [ ] Pas d'erreur TypeScript
- [ ] Compilation réussit

---

## 🚨 Si Quelque Chose Ne Marche Pas

| Problème | Solution |
|----------|----------|
| RechargePage crashes | Vérifier console (F12). Voir `DEPLOYMENT_TESTING.md` Troubleshooting |
| Payment n'affiche pas titulaire | Vérifier account_holder_name en DB payment_methods |
| ID transfer ne se valide pas | Vérifier regex regex: `/^\d{9,11}$/` dans Payment.tsx |
| POST /recharge erreur 401 | Vérifier token JWT en localStorage (DevTools) |
| POST /recharge erreur 500 | Vérifier logs backend (terminal npm run dev) |
| Portefeuille ne se met pas à jour | Vérifier approveDeposit en admin flow |

---

## 📝 Résumé Quick Start

| Étape | Time | Action |
|-------|------|--------|
| 1 | 5 min | Lire cette checklist |
| 2 | 10 min | Revue code (3 fichiers) |
| 3 | 10 min | Setup backend + créer payment method |
| 4 | 10 min | Setup frontend |
| 5 | 20 min | Test flux complet (6 étapes) |
| 6 | 20 min | Vérifier DB |
| 7 | 10 min | Test admin approbation |
| **Total** | **~1.5 heures** | **Complètement testé** |

---

## 🎯 Objectif Atteint?

Si toutes les cases sont cochées ✅, l'implémentation est:
- ✅ **Fonctionnelle** - Flux complet travaille
- ✅ **Testée** - Tous les scénarios validés
- ✅ **Sécurisée** - Admin approbation requise
- ✅ **Tracée** - Transfer ID stocké
- ✅ **Production-Ready** - Prêt à déployer

---

## 📞 Besoin d'Aide?

- **Erreur Frontend?** → Voir `DEPLOYMENT_TESTING.md` section "Test Frontend"
- **Erreur Backend?** → Voir `DEPLOYMENT_TESTING.md` section "Test Backend"
- **Erreur DB?** → Voir `TESTING_GUIDE.md` section "Test DB"
- **Général?** → Lire `QUICK_START_IMPLEMENTATION.md`

---

**VOUS ÊTES PRÊT! 🚀** Commencez par l'Étape 1 ci-dessus.
