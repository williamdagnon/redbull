# 🧪 GUIDE DE TEST VISUEL - 6 CORRECTIONS

## 1️⃣ Test: Vrais Produits VIP + Stock Épuisé

### Étape 1: Naviguer vers "VIP"
- [ ] Cliquez sur l'onglet "VIP" du Dashboard

### Étape 2: Vérifier les produits
- [ ] Les 10 produits VIP s'affichent avec noms, prix min, % quotidien
- [ ] **Produits niveau 5+ (Diamond 100K, Elite 250K, Master 500K, etc.):**
  - [ ] Badge rouge "Stock épuisé" visible sur le produit
  - [ ] Bouton rouge "Stock épuisé" (non cliquable)
  - [ ] Acheter est impossible pour ces produits

### Exemple de vérification:
```
VIP Diamond - min: 100.000 FCFA
├─ Badge: "🔴 Stock épuisé"
├─ Bouton: "Stock épuisé" (grisé)
└─ Cliquer: Ne fait rien ✓
```

---

## 2️⃣ Test: Banques Dynamiques (Dépôts)

### Étape 1: Ouvrir "Nouveau Dépôt"
- [ ] Onglet "Portefeuille" → Bouton "Nouveau dépôt"

### Étape 2: Remplir jusqu'à l'étape "Banque"
- [ ] Montant: 5000 FCFA
- [ ] Méthode: Sélectionner une méthode
- [ ] Suivant → Bouton "Sélectionner banque"

### Étape 3: Vérifier les vraies banques
- [ ] Les banques de la base de données s'affichent
- [ ] **Exemples attendus:**
  - [ ] Bank of Africa
  - [ ] Ecobank
  - [ ] Orangemoney
  - [ ] Moov Money
  - [ ] Etc.

### Étape 4: Sélectionner et confirmer
- [ ] Sélectionner une banque
- [ ] Entrer numéro de compte fictif
- [ ] Confirmer le dépôt

---

## 3️⃣ Test: Parrainage - Lien Dynamique + Copie + Partage

### Étape 1: Naviguer vers "Équipe"
- [ ] Onglet "Équipe" du Dashboard

### Étape 2: Vérifier le code de parrainage
- [ ] Code personnel affiché (ex: `ABCD1234`)
- [ ] Bouton copie bleu fonctionnel
- [ ] [ ] Toast "Code copié !" apparaît

### Étape 3: Vérifier le lien de parrainage
- [ ] Lien complet visible:
  ```
  http://localhost:5173?ref=ABCD1234
  (ou https://domaine.com?ref=ABCD1234 en prod)
  ```
- [ ] Bouton copie vert: Copie le lien complet
- [ ] Bouton "Partager" (violet): 
  - [ ] Ouvre le partage natif (iOS/Android)
  - [ ] Ou copie si partage non disponible

### Étape 4: Tester le partage
- [ ] Copier le lien
- [ ] L'envoyer à quelqu'un via SMS/WhatsApp
- [ ] Personne clique le lien

---

## 4️⃣ Test: Code Parrainage Auto-Rempli

### Étape 1: Accéder via lien de parrainage
- [ ] Ouvrir l'URL: `http://localhost:5173?ref=TESTCODE`

### Étape 2: Vérifier le pré-remplissage
- [ ] L'app redirige vers SignupForm
- [ ] Le champ "Code de Parrainage" contient: `TESTCODE`
- [ ] Champ auto-rempli et non éditable (optionnel)

### Étape 3: S'inscrire
- [ ] Téléphone: +22261234567
- [ ] Mot de passe: Test1234
- [ ] Nom: Jean Test
- [ ] Code parrainage: TESTCODE (pré-rempli ✓)
- [ ] Cliquer "S'inscrire"

### Étape 4: Vérifier dans la BD
```sql
-- Vérifier que referred_by contient l'ID du parrain
SELECT id, phone, referred_by, referral_code 
FROM users 
WHERE phone = '+22261234567';
```

---

## 5️⃣ Test: Commissions Parrainage (30%/3%/3%)

### Pré-conditions:
- [ ] Utilisateur A = Parrain (referral_code = `PATRON123`)
- [ ] Utilisateur B = Filleul (referred_by = A.id)
- [ ] Utilisateur C = Petit-filleul (referred_by = B.id)
- [ ] Utilisateur D = Arrière-petit-filleul (referred_by = C.id)

### Étape 1: Vérifier les taux en Admin Panel
- [ ] Onglet "Statistiques" → Voir les commissions
- [ ] **Attendu après dépôt de B (5000 FCFA):**
  ```
  A (Niveau 1): +1500 FCFA (30% de 5000)
  B (Niveau 2 si parent): +150 FCFA (3% de 5000)
  C (Niveau 3 si grand-parent): +150 FCFA (3% de 5000)
  ```

### Étape 2: B effectue son premier dépôt
- [ ] Montant: 5000 FCFA
- [ ] Méthode: Bank of Africa
- [ ] Compte: 1234567890
- [ ] Soumettre

### Étape 3: Admin approuve le dépôt
- [ ] Admin Panel → Onglet "Dépôts"
- [ ] Trouver la demande de B
- [ ] Cliquer "✅ Approuver"

### Étape 4: Vérifier les commissions
- [ ] Équipe de A → Vérifier:
  ```
  Commission Niveau 1: 1500 FCFA
  Commission Niveau 2: 150 FCFA (si C existe)
  Commission Niveau 3: 150 FCFA (si D existe)
  ```
- [ ] Solde de A augmenté automatiquement
- [ ] Transaction "Commission de parrainage" visible

---

## 6️⃣ Test: Admin Panel - Tous les CRUD

### Étape 1: Accéder au Panel Admin
- [ ] Connexion avec compte admin (is_admin = true)
- [ ] Redirection automatique vers Admin Panel

### Étape 2: Tester chaque onglet

#### Utilisateurs
- [ ] [ ] Lister les utilisateurs
- [ ] [ ] Ajouter nouvel utilisateur
- [ ] [ ] Activer/Désactiver utilisateur
- [ ] [ ] Supprimer utilisateur

#### VIP Products
- [ ] [ ] Lister produits (voir le "Stock épuisé" sur min >= 100K)
- [ ] [ ] Ajouter produit VIP
- [ ] [ ] Modifier produit
- [ ] [ ] Supprimer produit

#### Dépôts
- [ ] [ ] Lister les dépôts en attente
- [ ] [ ] Approuver un dépôt → Solde utilisateur augmente
- [ ] [ ] Rejeter un dépôt → Notification utilisateur
- [ ] [ ] Voir les logs d'approbation

#### Retraits
- [ ] [ ] Lister les retraits en attente
- [ ] [ ] Approuver un retrait → Solde utilisateur diminue
- [ ] [ ] Rejeter un retrait
- [ ] [ ] Voir les frais (6%) déduits

#### Banques
- [ ] [ ] Lister les banques actives
- [ ] [ ] Ajouter banque
- [ ] [ ] Désactiver banque
- [ ] [ ] Les banques inactives ne s'affichent pas en dépôt/retrait

#### Investissements
- [ ] [ ] Lister les investissements actifs
- [ ] [ ] Mettre en pause un investissement
- [ ] [ ] Reprendre un investissement
- [ ] [ ] Annuler un investissement

#### Statistiques
- [ ] [ ] Solde total affiché
- [ ] [ ] Nombre d'utilisateurs
- [ ] [ ] Total investi
- [ ] [ ] Total commission distribuée

#### Logs
- [ ] [ ] Voir toutes les actions admin
- [ ] [ ] Timestamp et détails visible
- [ ] [ ] Filtrer par type d'action (si disponible)

---

## ✅ CHECKLIST FINALE

```
Correction 1: Vrais Produits VIP
[ ] Produits chargés de la BD
[ ] Affichage dynamique
[ ] Fallback aux constantes OK

Correction 2: Stock Épuisé
[ ] Min >= 100K = "Stock épuisé"
[ ] Badge rouge visible
[ ] Achat impossible

Correction 3: Banques Dynamiques
[ ] Dépôt charge banques BD
[ ] Retrait charge banques BD
[ ] Vraies banques du système

Correction 4: Parrainage 30/3/3
[ ] Taux corrects en BD
[ ] Commissions distribuées après 1er dépôt
[ ] Crédité au solde automatiquement

Correction 5: Lien Dynamique
[ ] URL: domaine?ref=CODE
[ ] Bouton copie fonctionne
[ ] Bouton partage fonctionne
[ ] Partage natif actif

Correction 6: Code Auto-Rempli
[ ] Lien ?ref=CODE pré-remplit le code
[ ] Code visible dans le formulaire
[ ] Inscription complétée avec code

Admin Panel
[ ] Tous CRUD fonctionnels
[ ] Authentification OK
[ ] Logs enregistrés
```

---

## 🚨 DÉBOGAGE RAPIDE

### Problème: Stock épuisé n'apparaît pas
```
Solution:
1. Vérifier min_amount dans BD: SELECT * FROM vip_products WHERE level >= 5;
2. Si min < 100000, modifier: UPDATE vip_products SET min_amount = 100000 WHERE level = 5;
3. Rafraîchir la page (F5)
```

### Problème: Banques ne chargent pas
```
Solution:
1. Vérifier endpoint: GET http://localhost:3000/api/deposits/banks
2. Vérifier BD: SELECT * FROM banks WHERE is_active = TRUE;
3. Logs backend: npm run dev (voir les erreurs)
```

### Problème: Code parrainage ne pré-remplit pas
```
Solution:
1. Vérifier URL: http://localhost:5173?ref=TESTCODE
2. Ouvrir DevTools → Console → Vérifier les erreurs
3. Vérifier que URLSearchParams fonctionne: Taper params.get('ref')
```

### Problème: Commissions ne sont pas crédités
```
Solution:
1. Vérifier BD: SELECT * FROM referral_commissions WHERE referrer_id = 'XXX';
2. Vérifier status: Si 'pending', pas encore crédité
3. Si status='paid', vérifier wallet: SELECT balance FROM wallets WHERE user_id = 'XXX';
4. Logs backend pour les erreurs lors de payCommission()
```

---

## 📞 SUPPORT

Si un test échoue:
1. Vérifier les logs du backend: `npm run dev`
2. Vérifier la console du navigateur: F12
3. Vérifier la BD directement
4. Vérifier l'authentification: Token valide?
5. Vérifier les permissions: is_admin = true pour Admin Panel

---

**✅ Tous les tests passent = Prêt pour production!** 🎉
