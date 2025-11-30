# Implémentation du Flux de Recharge Complet

## 📋 Résumé des Changements

### 1. **RechargePage.tsx** (Frontend)
**Étape 1 : Collecte du montant et de la méthode de paiement**

- ✅ Input du montant FCFA avec boutons montants rapides (2K, 5K, 10K, 20K, 50K, 100K, 200K, 500K)
- ✅ Affichage de l'historique des recharges (lien)
- ✅ **Bouton retour (◀) en haut à gauche** pour revenir au Dashboard
- ✅ Sélection de la méthode de paiement avec radios
- ✅ Affichage du numéro de compte pour chaque méthode

**Changements clés :**
```tsx
// Charger les payment_methods depuis le backend
const resp = await api.getPaymentMethods();
const methods = resp.data; // Contient account_number, account_holder_name

// Passer les infos au composant Payment
<Payment 
  amount={amount} 
  payWay={payWay} 
  accountNumber={selectedMethod?.account_number}
  accountHolderName={selectedMethod?.account_holder_name} 
/>
```

---

### 2. **Payment.tsx** (Frontend - Wizard 3 étapes)

#### **Étape 1 : Informations générales**
- ✅ Numéro mobile (format 8 chiffres)
- ✅ Validation requise avant de passer à l'étape 2

#### **Étape 2 : Compte de paiement** ⭐ PRINCIPAL
- ✅ **Titulaire du compte** (avec cadre rouge, reçu du backend)
  ```tsx
  <div className="border-2 border-red-500 p-4 rounded mb-4">
    <label>Titulaire du compte :</label>
    <p className="text-lg font-bold text-red-600">{accountHolderName}</p>
  </div>
  ```
  
- ✅ **Numéro de compte** (avec cadre rouge, reçu du backend)
  ```tsx
  <div className="border-2 border-red-500 p-4 rounded mb-4">
    <label>Numéro de compte :</label>
    <p className="text-xl font-bold text-red-600">{account}</p>
  </div>
  ```
  
- ✅ **Bouton "Copier" pour le numéro de compte**
- ✅ **Code USSD** avec bouton "Copier"
- ✅ **Lien "Allez payer"** (tel: USSD)
- ✅ **ID de transfert obligatoire** (avec cadre rouge)
  ```tsx
  <div className="border-2 border-red-500 p-4 rounded mt-6">
    <label className="block font-semibold text-red-600 mb-2">
      Entrez l'ID de transfert :
    </label>
    <input
      type="text"
      maxLength={20}
      className="w-full border p-3 rounded mt-2"
      placeholder="ID de transfert"
      value={transferId}
      onChange={(e) => setTransferId(e.target.value)}
    />
  </div>
  ```

#### **Étape 3 : Paiement terminé**
- ✅ Récapitulatif avec :
  - Numéro mobile
  - ID de transfert
- ✅ **Soumission du dépôt à l'admin pour approbation** (Bouton "Soumettre")
  ```tsx
  const payload = {
    amount,
    pay_way_id: payWay,
    transfer_id: transferId,        // ← Saisi à l'étape 2
    customer_mobile: customerMobile  // ← Saisi à l'étape 1
  };
  
  const res = await postJSON('/recharge', payload);
  
  if (res.status === 1) {
    // Succès - redirection vers Dashboard
    window.location.href = '/?deposit_success=1';
  }
  ```

---

### 3. **Backend Route POST /recharge** (Node.js + Express)

**Endpoint:** `POST /api/recharge`

**Requête reçue:**
```json
{
  "amount": 10000,
  "pay_way_id": "uuid-payment-method-id",
  "transfer_id": "123456789",
  "customer_mobile": "95123456"
}
```

**Traitement:**
1. ✅ Authentifier l'utilisateur
2. ✅ Valider le montant (>= minDeposit)
3. ✅ Créer un enregistrement `deposits` avec :
   - `user_id`: UUID utilisateur
   - `amount`: 10000
   - `payment_method`: Nom de la méthode (ex: "Bank Transfer")
   - `account_number`: `customer_mobile` (ex: "95123456")
   - `transaction_id`: Ordre ID (ex: "I1700000000000")
   - `transfer_id`: ID de transfert (ex: "123456789")
   - `status`: "pending"
   - `is_first_deposit`: boolean

4. ✅ Créer une `transaction` liée au dépôt (status: "pending")

5. ✅ Retourner succès à l'utilisateur :
```json
{
  "status": 1,
  "msg": "Dépôt créé et en attente d'approbation",
  "result": {
    "depositId": "uuid-deposit",
    "orderCode": "I1700000000000"
  }
}
```

**Base de données (table `deposits`) :**
```sql
INSERT INTO deposits (
  id, user_id, amount, payment_method, 
  account_number, transaction_id, transfer_id, 
  status, is_first_deposit
) VALUES (
  'uuid-deposit', 'user-id', 10000, 'Bank Transfer',
  '95123456', 'I1700000000000', '123456789',
  'pending', TRUE
);
```

---

### 4. **Redirection utilisateur**

**Flux final :**
```
RechargePage (Montant + Méthode)
    ↓
Payment Étape 1 (Numéro mobile)
    ↓
Payment Étape 2 (Numéro de compte, ID de transfert) ← CLÉS
    ↓
Payment Étape 3 (Récapitulatif)
    ↓
POST /recharge (Backend crée deposit + transaction)
    ↓
✅ Redirection vers Dashboard (?deposit_success=1)
```

**Message utilisateur :**
- ✅ "Dépôt soumis avec succès pour approbation"
- ✅ Redirection vers la page d'accueil après 1.5s

---

## 🔑 Points Clés Implémentés

### ✅ Affichage du numéro de compte
- Chargé depuis `payment_methods.account_number` (défini par l'admin)
- Affiché dans Payment Étape 2 avec cadre rouge
- Bouton "Copier" pour faciliter le copier-coller

### ✅ Affichage du titulaire du compte
- Chargé depuis `payment_methods.account_holder_name` (défini par l'admin)
- Affiché dans Payment Étape 2 avec cadre rouge
- Identification claire du compte destinataire

### ✅ Champ ID de transfert obligatoire
- Saisi par l'utilisateur à l'étape 2
- Validation numérique (9-11 chiffres)
- Encadré en rouge pour évidence
- Stocké dans `deposits.transfer_id`

### ✅ Approbation par l'admin
- Dépôt créé avec status "pending"
- Admin reçoit une notification/apparaît dans la liste des dépôts à approuver
- Admin peut approuver → `deposits.status = 'approved'` → portefeuille crédité

### ✅ Bouton retour vers Dashboard
- Flèche (◀) en haut à gauche de RechargePage
- Clique → `window.location.href = '/'`

---

## 📊 Structure des Données

### `payment_methods` (Table Admin-Gérée)
```sql
CREATE TABLE payment_methods (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255),                    -- Ex: "Bank Transfer"
  account_number VARCHAR(100),          -- Ex: "0011222333" (Numéro de compte)
  account_holder_name VARCHAR(255),     -- Ex: "Company Ltd" (Titulaire)
  min_deposit DECIMAL(14,2),
  is_active BOOLEAN
);
```

### `deposits` (Table Utilisateur)
```sql
CREATE TABLE deposits (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),                     -- Utilisateur qui recharge
  amount DECIMAL(15,2),                 -- Ex: 10000
  payment_method VARCHAR(100),          -- Ex: "Bank Transfer"
  account_number VARCHAR(50),           -- Ex: "95123456" (Mobile de l'utilisateur)
  transaction_id VARCHAR(255),          -- Ex: "I1700000000000"
  transfer_id VARCHAR(255),             -- Ex: "123456789" (ID saisi par utilisateur) ← CLÉS
  status ENUM('pending', 'approved', 'rejected')
);
```

---

## 🧪 Scénario de Test Complet

### 1. Utilisateur arrive sur RechargePage
- Voit "Recharge" avec bouton retour (◀)
- Saisit montant: 10000 FCFA
- Sélectionne méthode: "Bank Transfer"
  - Affiche: Numéro de compte 0011222333
- Clique "Démarrer le paiement"

### 2. Utilisateur voir Payment (Étape 1)
- Saisit numéro mobile: 95123456
- Clique "Suivant"

### 3. Utilisateur voir Payment (Étape 2) ⭐
- Voit encadré rouge:
  - Titulaire: "Company Ltd"
  - Numéro: "0011222333"
- Voit code USSD avec option appel
- **Saisit ID de transfert: "123456789"** ← IMPORTANT
- Clique "Suivant"

### 4. Utilisateur voir Payment (Étape 3)
- Voit récap : Mobile, ID de transfert
- Clique "Soumettre"
- Backend crée deposit + transaction
- Message: "Dépôt soumis avec succès pour approbation"
- Redirection vers Dashboard

### 5. Admin Dashboard
- Voit nouveau dépôt en attente
- ID: 123456789
- Montant: 10000
- Utilisateur: +229 95123456
- Peut approuver → crédite portefeuille & commissions
- Peut rejeter → marque rejeté

---

## 📝 Fichiers Modifiés

1. ✅ `src/components/RechargePage.tsx` - Ajout bouton retour + affichage numéros de compte
2. ✅ `src/components/Payment.tsx` - Affichage compte + titulaire + champ ID de transfert
3. ✅ `backend/src/routes/recharge.routes.ts` - Accepter transfer_id + customer_mobile, stocker en DB

---

## ✔️ Validation TypeScript

```bash
✅ Payment.tsx - No errors
✅ RechargePage.tsx - No errors
✅ recharge.routes.ts - No errors
```

---

## 🚀 Prochaines Étapes

1. **Test complet en local** :
   - Frontend: `npm run dev`
   - Backend: `npm run dev`
   - Naviguer RechargePage → Payment → Soumission

2. **Vérifier l'affichage en Admin** :
   - Dépôt apparaît-il dans AdminDashboard ?
   - Peut-on approuver/rejeter ?

3. **Vérifier le portefeuille** :
   - À l'approbation, balance utilisateur augmente ?
   - Les commissions des filleuls sont-elles créditées (si 1er dépôt) ?

4. **Test mobile** :
   - Interface responsive sur petits écrans ?
   - Lien USSD fonctionne-t-il ?

---

## 💡 Notes Importantes

- **Champ obligatoire : ID de transfert** - Les utilisateurs DOIVENT le saisir pour valider
- **Numéro de compte/titulaire** - Viennent de la base de données (définis par admin lors création de payment_method)
- **Approbation admin** - Essentielle pour créditer le portefeuille (protection contre fraude)
- **Bouton retour** - Disponible sur RechargePage, pas besoin de bouton "Précédent" si utilisateur veut revenir
