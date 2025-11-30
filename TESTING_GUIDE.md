# 🧪 Guide de Test Complet - Flux de Recharge

## 📋 Avant de Commencer

### Prérequis
- [ ] Database MySQL initialisée avec le schéma
- [ ] Table `payment_methods` avec au moins une entrée active
- [ ] Backend configuré et tournant
- [ ] Frontend configuré et tournant
- [ ] Utilisateur connecté (token JWT en localStorage)

### Configuration Payment Methods (Admin)
Avant de tester, créer une méthode de paiement en DB:

```sql
INSERT INTO payment_methods (
  id, code, name, account_number, account_holder_name, min_deposit, is_active
) VALUES (
  UUID(), 
  'BANK_TEST',
  'Bank Transfer',
  '0011222333',        -- Numéro de compte (ce qu'on affichera)
  'Company Ltd',       -- Titulaire du compte (ce qu'on affichera)
  1000.00,
  1
);
```

---

## 🚀 Scénario de Test 1: Flux Complet Utilisateur

### Étape 1: Navigation vers Recharge

**Action:**
1. Connectez-vous à l'app
2. Allez à Dashboard
3. Cliquez sur l'onglet "Recharge" ou "Dépôt"
4. Vous devriez voir `RechargePage`

**Vérification:**
- [ ] Titre "Recharge" avec bouton retour (◀) en haut à gauche
- [ ] Input montant FCFA visible
- [ ] Boutons montants rapides affichés: [2K] [5K] [10K] [20K] [50K] [100K] [200K] [500K]
- [ ] Lien "Historique" présent
- [ ] Section "Méthode de paiement" avec radio buttons

**Expected Error Handling:**
- [ ] Si aucune méthode de paiement: affiche "Aucune méthode disponible"
- [ ] Le bouton "Démarrer le paiement" est disabled si montant ≤ 0

---

### Étape 2: Saisie du Montant

**Action:**
1. Saisissez montant: 10000
2. OU cliquez un bouton rapide, ex [10K]

**Vérification:**
- [ ] Input affiche 10000
- [ ] Bouton rapide [10K] reste surligné si vous avez cliqué dessus
- [ ] Bouton "Démarrer le paiement" devient actif (enabled)

**Expected Behavior:**
- [ ] Cliquer [5K] → amount devient 5000
- [ ] Modifier input à 7500 → [5K] n'est plus surligné

---

### Étape 3: Sélection Méthode de Paiement

**Action:**
1. Attendez le chargement des méthodes (si loading)
2. Vous devriez voir: ⦿ Bank Transfer (radio coché par défaut)
3. Voir également le numéro de compte: "Compte: 0011222333"

**Vérification:**
- [ ] Au moins une méthode affichée
- [ ] Première méthode est coché par défaut
- [ ] Numéro de compte visible sous la méthode
- [ ] Titulaire du compte visib quand on rentre dans Payment

---

### Étape 4: Démarrer le Paiement

**Action:**
1. Vérifiez: montant 10000, méthode "Bank Transfer" cochée
2. Cliquez "Démarrer le paiement"

**Vérification:**
- [ ] Page change vers `Payment` component
- [ ] Affiche "Montant: 10,000 XOF" en haut
- [ ] Wizard à étape 1 (cercle ① vert)

---

### Étape 5: Payment - Étape 1 (Infos Générales)

**Action:**
1. Saisissez numéro mobile: 95123456 (8 chiffres)
2. Cliquez "Suivant"

**Vérification:**
- [ ] Titre de l'étape: "Informations générales"
- [ ] Input "+229 [_________]" visible
- [ ] Message vert: "Veuillez utiliser la même méthode de transfert."
- [ ] Boutons: "Précédent" (disabled), "Suivant" (enabled)

**Expected Error Handling:**
- [ ] Saisir moins de 8 chiffres → cliquer "Suivant" → message d'erreur "Numéro invalide !"
- [ ] Saisir lettres → input ne doit accepter que des chiffres

---

### Étape 6: Payment - Étape 2 ⭐ (Compte de Paiement - PRINCIPAL)

**Action:**
1. Observez ce qui s'affiche

**Vérification - Section "Titulaire du compte":**
- [ ] Cadre rouge visible avec titre "Titulaire du compte :"
- [ ] Affiche: "Company Ltd" (du backend payment_methods)
- [ ] Texte en rouge gras

**Vérification - Section "Numéro de compte":**
- [ ] Cadre rouge visible avec titre "Numéro de compte :"
- [ ] Affiche: "0011222333" (du backend payment_methods)
- [ ] Bouton "Copier" à côté
- [ ] Texte en rouge gras

**Vérification - Code USSD:**
- [ ] Code USSD affiché: "*145*2*10000*0011222333#"
- [ ] Bouton "Copier" présent
- [ ] Bouton "Allez payer" (tel: link) présent

**Vérification - ID de Transfert (OBLIGATOIRE):**
- [ ] Cadre rouge visible
- [ ] Titre rouge: "Entrez l'ID de transfert :"
- [ ] Input texte vide, placeholder: "ID de transfert"
- [ ] MaxLength=20 (test: saisir > 20 caractères → s'arrête à 20)

**Test Interaction:**
1. [ ] Cliquez "Copier" sur le numéro de compte → affiche toast "Copié !"
2. [ ] Colllez dans l'input ID de transfert (ctrl+V)
3. [ ] Mais d'abord, essayons le test d'erreur...

---

### Étape 7: Payment - Étape 2 (Validation de l'ID de Transfert)

**Action:**
1. Cliquez "Suivant" SANS remplir l'ID de transfert
2. Observez le message d'erreur

**Vérification:**
- [ ] Message d'erreur: "ID de transfert invalide !"
- [ ] Vous restez à l'étape 2
- [ ] Le toast disparaît après 2 secondes

**Action 2:**
1. Saisissez 8 chiffres seulement: 12345678
2. Cliquez "Suivant"

**Vérification:**
- [ ] Message d'erreur: "ID de transfert invalide !" (moins de 9 chiffres)

**Action 3:**
1. Saisissez 9 chiffres: 123456789
2. Cliquez "Suivant"

**Vérification:**
- [ ] Vous passez à l'étape 3 ✓
- [ ] Le wizard montre: ① ▶ ② ▶ ③ Paiement terminé

---

### Étape 8: Payment - Étape 3 (Récapitulatif)

**Action:**
1. Observez le récapitulatif

**Vérification:**
- [ ] Titre: "Informations récapitulatives :"
- [ ] Affiche: "Numéro mobile : **+229 95123456**"
- [ ] Affiche: "ID de transfert : **123456789**"
- [ ] Texte: "Lorsque vous avez terminé, cliquez sur Soumettre."
- [ ] Bouton "Précédent" enabled
- [ ] Bouton "Soumettre" affiché (pas "Suivant")

---

### Étape 9: Soumettre le Dépôt

**Action:**
1. Cliquez "Soumettre"

**Backend Check (Console du navigateur):**
- [ ] POST /recharge avec payload:
  ```json
  {
    "amount": 10000,
    "pay_way_id": "uuid-payment-method-id",
    "transfer_id": "123456789",
    "customer_mobile": "95123456"
  }
  ```

**Frontend Vérification:**
- [ ] Message toast: "Dépôt soumis avec succès pour approbation"
- [ ] Après ~1.5s: redirection vers "/?deposit_success=1"

---

### Étape 10: Dashboard - Message de Succès

**Action:**
1. Observez la page d'accueil

**Vérification:**
- [ ] Si query param "?deposit_success=1" → affiche message de succès
- [ ] Message: "Votre dépôt a été soumis pour approbation"
- [ ] Utilisateur peut continuer à utiliser l'app

---

## 🧪 Scénario de Test 2: Bouton Retour

**Action:**
1. À partir de RechargePage, cliquez le bouton ◀ en haut à gauche

**Vérification:**
- [ ] Retour vers le Dashboard (/)
- [ ] Pas d'erreur dans la console

**Action 2:**
1. Allez à RechargePage
2. Cliquez "Démarrer le paiement" (vers Payment Étape 1)
3. Essayez de revenir avec le bouton navigateur du navigateur (← browser back)

**Vérification:**
- [ ] Revient à RechargePage
- [ ] Ou: peut être remplacé par le bouton "Précédent" du wizard si déjà en Payment

---

## 🧪 Scénario de Test 3: Validation Database

**Action:**
1. Complétez le flux jusqu'à "Soumettre"
2. Allez à votre client MySQL et exécutez:

```sql
-- Vérifier qu'un dépôt a été créé
SELECT * FROM deposits 
WHERE user_id = 'votre-user-id' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Vérification:**
- [ ] Une ligne dans `deposits` avec:
  - `amount`: 10000
  - `payment_method`: "Bank Transfer"
  - `account_number`: "95123456"  ← Mobile saisi, pas le compte backend
  - `transaction_id`: "I[timestamp]"
  - `transfer_id`: "123456789" ← CLÉS: ID de transfert saisi
  - `status`: "pending"
  - `is_first_deposit`: 1 (si 1er dépôt)

**Action 2:**
1. Vérifier la transaction liée:

```sql
SELECT * FROM transactions 
WHERE reference_id = 'uuid-deposit' 
LIMIT 1;
```

**Vérification:**
- [ ] Une ligne dans `transactions` avec:
  - `type`: "deposit"
  - `amount`: 10000
  - `status`: "pending"
  - `description`: "Inpay deposit - I[timestamp]"

---

## 🧪 Scénario de Test 4: Admin Approuve Dépôt

**Action 1:**
1. Connectez-vous en tant qu'admin
2. Allez à AdminDashboard → Section "Dépôts en Attente"

**Vérification:**
- [ ] Nouveau dépôt visible avec les infos:
  - Utilisateur: +229 95123456
  - Montant: 10,000 FCFA
  - ID de transfert: 123456789
  - Status: PENDING

**Action 2:**
1. Cliquez "Approuver" sur le dépôt

**Vérification:**
- [ ] Status change en "APPROVED"
- [ ] Dépôt disparaît de "En Attente", s'il y a une section "Approuvés"

**Action 3:**
1. Vérifier en DB:

```sql
-- Vérifier dépôt approuvé
SELECT * FROM deposits WHERE transfer_id = '123456789';
-- Doit avoir status = 'approved'

-- Vérifier portefeuille utilisateur
SELECT balance FROM wallets WHERE user_id = 'votre-user-id';
-- balance doit avoir augmenté de 10000
```

**Vérification:**
- [ ] `deposits.status` = "approved"
- [ ] `wallets.balance` += 10000
- [ ] `transactions.status` = "completed"

**Action 4:** (Si 1er dépôt)
1. Vérifier les commissions filleuls:

```sql
-- Si vous avez des filleuls (referred_by)
SELECT * FROM referral_commissions 
WHERE deposit_id = 'uuid-deposit' 
ORDER BY level;
```

**Vérification:**
- [ ] Lignes créées pour chaque niveau de filleul
- [ ] Montants correspondent aux taux (ex: 10% niveau 1)

---

## 🔧 Tests d'Erreur Handling

### Test 1: Montant invalide

**Action:**
1. Allez à RechargePage
2. Saisissez montant: 500 (si minDeposit > 500)
3. Cliquez "Démarrer le paiement"

**Expected:** 
- [ ] Message d'erreur: "Minimum deposit is [minDeposit]"

---

### Test 2: Pas de méthode de paiement

**Action:**
1. Si aucune méthode active en DB, RechargePage affiche:

**Expected:**
- [ ] Message: "Aucune méthode disponible"
- [ ] Bouton "Démarrer le paiement" disabled

---

### Test 3: Perte de connexion

**Action:**
1. À RechargePage, ouvrez DevTools → Network
2. Throttle: "Offline"
3. Sélectionnez une méthode, cliquez "Démarrer le paiement"

**Expected:**
- [ ] Erreur de chargement affichée gracefully
- [ ] Pas de crash

---

### Test 4: Token expiré

**Action:**
1. À Payment Étape 3, cliquez "Soumettre"
2. Avant que la requête aboutisse, videz localStorage (token supprimé)

**Expected:**
- [ ] Erreur 401 Unauthorized
- [ ] Message d'erreur: "Session expirée, veuillez vous reconnecter"

---

## 📱 Test Responsive

### Test: Mobile

**Action:**
1. Ouvrez l'app sur un téléphone (résolution < 640px)
2. Parcourez le flux complet

**Vérification:**
- [ ] Tous les éléments sont visibles et cliquables
- [ ] Les cadres rouges (titulaire, compte, ID) restent lisibles
- [ ] Les boutons sont assez grands pour cliquer
- [ ] Pas de débordement horizontal

**Test: Tablet**

**Action:**
1. Ouvrez sur une tablette (résolution 640-1024px)
2. Parcourez le flux

**Vérification:**
- [ ] Layout optimisé pour medium screen
- [ ] Les colonnes s'adaptent

---

## 🎬 Checklist Complète

### Frontend

- [ ] **RechargePage**
  - [ ] Affiche montant input
  - [ ] Affiche boutons montants rapides
  - [ ] Affiche lien historique
  - [ ] Affiche radio méthodes de paiement
  - [ ] Affiche numéro de compte pour chaque méthode
  - [ ] Bouton retour (◀) fonctionne
  - [ ] Validation: montant > 0 et méthode sélectionnée requis

- [ ] **Payment Étape 1**
  - [ ] Input numéro mobile +229
  - [ ] Validation: 8 chiffres uniquement
  - [ ] Boutons Précédent/Suivant fonctionnent

- [ ] **Payment Étape 2** ⭐
  - [ ] Cadre rouge titulaire du compte
  - [ ] Cadre rouge numéro de compte
  - [ ] Bouton "Copier" pour les deux
  - [ ] Code USSD affiché et copiable
  - [ ] Lien "Allez payer" (tel:)
  - [ ] Cadre rouge ID de transfert (input)
  - [ ] Validation: 9-11 chiffres requis
  - [ ] Boutons Précédent/Suivant fonctionnent

- [ ] **Payment Étape 3**
  - [ ] Affiche récapitulatif (mobile + ID transfer)
  - [ ] Bouton "Soumettre" envoie POST /recharge
  - [ ] Affiche message succès
  - [ ] Redirige vers Dashboard

### Backend

- [ ] **POST /recharge**
  - [ ] Accepte `amount`, `pay_way_id`, `transfer_id`, `customer_mobile`
  - [ ] Valide montant >= minDeposit
  - [ ] Crée `deposits` row avec tous les champs
  - [ ] Crée `transactions` row liée
  - [ ] Retourne status 1 + depositId
  - [ ] Gère erreurs (montant invalide, pas de auth, etc.)

- [ ] **Database**
  - [ ] `deposits.transfer_id` rempli correctement
  - [ ] `deposits.account_number` = customer_mobile
  - [ ] `deposits.payment_method` = nom de la méthode
  - [ ] `transactions` créée avec reference_id correct

### Admin

- [ ] **AdminDashboard**
  - [ ] Affiche dépôts PENDING
  - [ ] Affiche les infos (user, montant, ID transfer)
  - [ ] Bouton "Approuver" fonctionne
  - [ ] Status change après approbation

- [ ] **Après Approbation**
  - [ ] `deposits.status` = "approved"
  - [ ] `wallets.balance` augmente
  - [ ] `transactions.status` = "completed"
  - [ ] Commissions filleuls crédités (si 1er dépôt)

---

## 📸 Captures d'Écran à Vérifier

1. **RechargePage** - Montant + Méthode
2. **Payment Étape 2** - Cadres rouges (titulaire + compte + ID transfer)
3. **Message Succès** - Toast "Dépôt soumis"
4. **AdminDashboard** - Dépôt PENDING visible
5. **AdminDashboard** - Après approbation, status APPROVED

---

## 🚨 Problèmes Courants

| Problème | Cause | Solution |
|----------|-------|----------|
| `account_holder_name` vide | Payment method pas remplie en DB | Vérifier la migration `payment_methods` |
| `transfer_id` pas sauvé en DB | Backend ne l'accepte pas | Vérifier POST /recharge payload |
| Numéro de compte ne s'affiche pas | `account_number` pas de réponse API | Vérifier API.getPaymentMethods() |
| Validation ID transfer ne fonctionne pas | Regex incorrect (< 9 chiffres) | Vérifier regex: `/^\d{9,11}$/` |
| Redirection échoue après succès | Token expiré ou erreur réseau | Vérifier console pour erreurs |
| Pas de dépôt en DB après succès | Backend POST échoue silencieusement | Vérifier logs backend |

---

## ✅ Quand C'est Prêt

Vous pouvez considérer l'implémentation comme **complète** quand:

- [x] Frontend affiche titulaire + compte + ID de transfert
- [x] Backend accepte et stocke transfer_id + customer_mobile
- [x] Admin peut approuver et créditer le portefeuille
- [x] Redirection vers Dashboard après soumission
- [x] Aucune erreur TypeScript
- [x] Toutes les validations fonctionnent
- [x] Mobile responsive

---

## 📝 Notes pour le Test

- Utilisez des montants > minDeposit (vérifiez sa valeur en constants)
- Pour premier dépôt, les commissions doivent être calculées
- L'ID de transfert est crucial pour tracer les transactions
- Le titulaire du compte doit être défini dans payment_methods par l'admin
