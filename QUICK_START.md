# ⚡ QUICK START - PANNEAU ADMIN EN 5 MINUTES

## 🚀 Démarrage Rapide

### 1️⃣ Lancer le Backend
```bash
cd backend
npm install
npm start
# ✅ Serveur lancé sur http://localhost:3000
```

### 2️⃣ Lancer le Frontend
```bash
cd ..
npm install
npm run dev
# ✅ Frontend sur http://localhost:5173
```

### 3️⃣ Créer un Compte Admin (Base de Données)
```sql
-- Insérez un admin dans la table users
INSERT INTO users (phone, password_hash, full_name, country_code, is_admin, is_active, created_at)
VALUES (
  '+212612345678',
  '$2b$10$...hash_du_mot_de_passe...',
  'Admin User',
  '+212',
  true,
  true,
  NOW()
);
```

### 4️⃣ Se Connecter
- Accédez à http://localhost:5173
- Entrez le téléphone et mot de passe
- ✅ Redirection automatique vers AdminDashboard

### 5️⃣ Vous êtes Admin ! 🎉
- Tous les 9 onglets sont disponibles
- Commencez à gérer

---

## 📋 Tests Rapides

### Test 1: Créer un Utilisateur
1. Allez à **Utilisateurs**
2. Cliquez **+ Ajouter un utilisateur**
3. Remplissez: Téléphone, Nom, Mot de passe, Code pays
4. Cliquez **Enregistrer**
5. ✅ Utilisateur créé

### Test 2: Vérifier Stock Épuisé
1. Allez à **Produits VIP**
2. Cliquez **+ Ajouter un produit VIP**
3. Créez avec `min_amount: 100000`
4. ✅ Vous verrez "Stock épuisé"

### Test 3: Approuver un Dépôt
1. Allez à **Dépôts**
2. Filtrez par **En Attente**
3. Cliquez ✅ (bouton approuver)
4. ✅ Dépôt approuvé

### Test 4: Gérer un Investissement
1. Allez à **Investissements**
2. Sélectionnez un investissement **Actif**
3. Cliquez **Mettre en pause**
4. Cliquez **Reprendre**
5. ✅ Investissement géré

---

## 📊 Modules Disponibles

| Onglet | Fonction |
|--------|----------|
| 📊 Statistiques | Voir les chiffres clés |
| 💰 Dépôts | Approuver/Rejeter les dépôts |
| 💸 Retraits | Approuver/Rejeter les retraits |
| 👥 Utilisateurs | Créer/Modifier/Supprimer utilisateurs |
| 👑 Produits VIP | Gérer les plans VIP (+ Stock Épuisé) |
| 🏦 Banques | Gérer les banques |
| ⚡ Investissements | Pause/Reprendre/Annuler investissements |
| 📝 Logs | Voir l'historique des actions |
| ⚙️ Paramètres | Informations système |

---

## 🎯 Cas d'Usage Courants

### Créer un Admin
```sql
-- Dans la BD
INSERT INTO users ... is_admin = true ...
```

### Approuver un Dépôt
1. Dépôts → Filtrer "En Attente"
2. Cliquer ✅ (approuver)

### Gérer un Produit VIP
1. Produits VIP → + Ajouter
2. Remplir: Niveau, Nom, Montant min
3. Si min >= 100.000 → "Stock épuisé" 👁️

### Mettre en Pause un Investissement
1. Investissements → Sélectionner
2. Cliquer ⏸️ (pause)
3. Cliquer ▶️ (reprendre) pour continuer

---

## ❌ Problèmes Courants

### ❌ Pas de redirection vers Admin
**Solution**: Vérifiez `is_admin = true` dans la BD

### ❌ Stock Épuisé n'apparaît pas
**Solution**: Assurez-vous que `min_amount >= 100000`

### ❌ Les données ne se chargent pas
**Solution**: Vérifiez que le backend est lancé sur port 3000

### ❌ Erreur de connexion
**Solution**: Vérifiez la base de données et le mot de passe

---

## 🔑 Clés à Retenir

✅ **is_admin = true** → Accès admin  
✅ **min_amount >= 100.000** → Stock épuisé  
✅ **Status: active/paused/cancelled** → Pour investissements  
✅ **Toutes les données** → En temps réel via API  
✅ **Confirmations** → Pour actions dangereuses  

---

## 📞 URLs Utiles

| URL | Fonction |
|-----|----------|
| http://localhost:5173 | Frontend |
| http://localhost:3000 | Backend API |
| http://localhost:5173/admin | Dashboard Admin (auto-redirect) |

---

## ✅ Vous êtes Prêt !

**Lancez, testez et déployez ! 🚀**

Pour plus de détails, consultez:
- **ADMIN_PANEL_GUIDE.md** - Guide complet
- **DEPLOYMENT_CHECKLIST.md** - Checklist
- **ADMIN_OVERVIEW.txt** - Vue d'ensemble visuelle
