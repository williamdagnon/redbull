# Guide Complet - Panneau d'Administration

## 📊 Modules Implémentés

### 1. **Gestion des Utilisateurs**
- Liste complète des utilisateurs avec filtrage
- Création manuelle d'utilisateurs (téléphone, nom, mot de passe, code pays)
- Activation/Désactivation des utilisateurs
- Affichage du solde, investissements, gains
- Code de parrainage unique par utilisateur

### 2. **Gestion des Produits VIP** ⭐
- Création de produits VIP avec niveau, nom, montant minimum
- Configuration du rendement quotidien et durée
- **Règle spéciale** : Les produits avec montant minimum ≥ 100.000 F affichent "Stock épuisé"
- Modification et suppression de produits
- Activation/Désactivation

### 3. **Gestion des Dépôts**
- Liste des dépôts par statut (En attente, Approuvés, Rejetés)
- Approbation et rejet des dépôts
- Affichage des méthodes de paiement
- Historique complet avec dates et montants

### 4. **Gestion des Retraits**
- Liste des retraits par statut
- Approbation et rejet des retraits
- Affichage de la banque destinataire
- Traçabilité complète

### 5. **Gestion des Banques**
- CRUD complet des banques
- Code et pays de la banque
- Activation/Désactivation
- Suppression sécurisée avec confirmation

### 6. **Gestion des Investissements Utilisateurs**
- Liste de tous les investissements VIP en cours
- **Actions disponibles** :
  - ✅ Mettre en pause un investissement (status: paused)
  - ▶️ Reprendre un investissement pausé (status: active)
  - ❌ Annuler complètement un investissement (status: cancelled)
- Affichage du utilisateur, produit, montant, dates
- Recherche et filtrage

### 7. **Statistiques Globales**
- Nombre total d'utilisateurs
- Total des dépôts et dépôts en attente
- Total des retraits et retraits en attente
- Total des investissements et investissements actifs
- Commissions totales gagnées

### 8. **Logs d'Activité**
- Historique de tous les actions admin
- Détails de l'action, utilisateur affecté, admin responsable
- Timestamps complets

---

## 🚀 Lancement de l'Application

### **Prérequis**
```bash
Node.js >= 18
PostgreSQL >= 13
npm >= 9
```

### **1. Démarrer le Backend**

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances
npm install

# Configurer l'environnement (.env)
# DATABASE_URL=postgresql://user:password@localhost:5432/apuic_db
# JWT_SECRET=your_secret_key
# SMS_API_KEY=your_sms_api_key
# ADMIN_PHONE=+XXX... (téléphone admin)

# Lancer le serveur
npm start
# Ou en développement
npm run dev
```

Le serveur démarrera sur **http://localhost:3000**

### **2. Démarrer le Frontend**

```bash
# Retourner à la racine du projet
cd ..

# Installer les dépendances
npm install

# Lancer le serveur de développement Vite
npm run dev
```

Le frontend sera disponible sur **http://localhost:5173**

---

## 🔐 Accès Admin

### **Flux de Connexion Admin**
1. Un utilisateur avec `is_admin = true` dans la BD peut se connecter
2. Après authentification réussie, il sera automatiquement redirigé vers le tableau de bord admin
3. Les utilisateurs normaux iront vers le dashboard utilisateur

### **Créer un Compte Admin** (En BD)
```sql
-- Exemple pour créer un admin manuellement
INSERT INTO users (phone, password_hash, full_name, country_code, is_admin, is_active, created_at)
VALUES (
  '+212612345678',
  'hashed_password_here',
  'Admin User',
  '+212',
  true,
  true,
  NOW()
);
```

Ou via l'endpoint API d'enregistrement spécial (si implémenté).

---

## 📋 Tests par Cas d'Usage

### **Test 1 : Authentification Admin**
```
1. Accédez à http://localhost:5173
2. Connectez-vous avec un compte admin
3. Vérifiez la redirection vers AdminDashboard
```

### **Test 2 : Gestion des Utilisateurs**
```
1. Allez à l'onglet "Utilisateurs"
2. Cliquez sur "Ajouter un utilisateur"
3. Remplissez le formulaire (téléphone, nom, mot de passe, code pays)
4. Vérifiez la création en BD
5. Testez le blocage/déblocage
```

### **Test 3 : Gestion des Produits VIP**
```
1. Allez à l'onglet "Produits VIP"
2. Créez un produit avec min_amount = 50.000 F
3. Vérifiez que le statut affiche "Actif"
4. Créez un produit avec min_amount = 100.000 F
5. Vérifiez que le statut affiche "Stock épuisé" ⭐
6. Testez la modification et suppression
```

### **Test 4 : Approbation des Dépôts**
```
1. Allez à l'onglet "Dépôts"
2. Filtrez par "En Attente"
3. Approbez ou rejetez un dépôt
4. Vérifiez la mise à jour en BD
5. Vérifiez que le statut change dans la liste
```

### **Test 5 : Gestion des Investissements**
```
1. Allez à l'onglet "Investissements"
2. Sélectionnez un investissement actif
3. Cliquez "Mettre en pause"
4. Vérifiez que le statut devient "Pausé"
5. Cliquez "Reprendre"
6. Vérifiez que le statut redevient "Actif"
7. Testez l'annulation avec confirmation
```

### **Test 6 : Parrainage (Dashboard Utilisateur)**
```
1. Connectez-vous comme utilisateur normal
2. Allez à l'onglet "Mon Équipe"
3. Vérifiez l'affichage du code de parrainage
4. Vérifiez les statistiques de parrainage (niveau 1, 2, 3)
5. Vérifiez l'historique des commissions
6. Testez la copie du code
```

### **Test 7 : Statistiques Globales**
```
1. Allez à l'onglet "Statistiques"
2. Vérifiez les chiffres :
   - Nombre d'utilisateurs
   - Montants des dépôts/retraits
   - Nombre d'investissements actifs
   - Total des commissions
```

---

## 🔄 Flux de Données en Temps Réel

### **Dépôt → Investissement VIP → Gains → Commissions**

```
1. Utilisateur effectue un DÉPÔT (status: pending)
   ↓ Admin approuve
2. Dépôt approuvé (status: approved) + balance augmente
   ↓ Utilisateur investit en VIP
3. Investissement VIP créé (status: active)
   ↓ Gains quotidiens calculés
4. Gains s'accumulent → Commissions pour parrains (niveau 1, 2, 3)
   ↓ Utilisateur demande un RETRAIT
5. Retrait demandé (status: pending)
   ↓ Admin approuve
6. Retrait approuvé (status: approved) + balance diminue
```

---

## 🐛 Dépannage

### **Problème : Admin dashboard pas accessible**
- Vérifiez que `is_admin = true` dans la BD
- Vérifiez le token JWT dans localStorage
- Vérifiez les logs backend pour les erreurs d'authentification

### **Problème : Stock épuisé ne s'affiche pas**
- Vérifiez que le montant minimum du produit VIP ≥ 100.000 F
- Rafraîchissez la page (Actualiser)
- Vérifiez la BD pour la valeur min_amount

### **Problème : Investissements ne se mettent pas en pause**
- Vérifiez l'endpoint backend `/admin/vip-investments/:id/toggle-status`
- Vérifiez que le statut envoyé est correct ("paused" ou "active")
- Vérifiez les logs backend

### **Problème : Erreurs lors de la création d'utilisateur**
- Vérifiez les champs requis (phone, full_name, password, country_code)
- Vérifiez que le téléphone n'existe pas déjà
- Vérifiez les logs backend pour les contraintes BD

---

## 📱 Architecture

### **Frontend Stack**
- **React 18** + TypeScript
- **Tailwind CSS** pour le style
- **Lucide Icons** pour les icônes
- **Vite** pour le build
- Composants réutilisables (`AdminForms.tsx`, `FormModal`, `ConfirmDialog`)

### **Backend Stack**
- **Express.js** + TypeScript
- **PostgreSQL** pour la base de données
- **JWT** pour l'authentification
- Middleware custom pour `authenticate` sur routes admin
- Services séparés (user, deposit, vip, wallet, referral)

### **API Endpoints Admin**
```
GET    /admin/stats
GET    /admin/users
POST   /admin/users
PUT    /admin/users/:id
DELETE /admin/users/:id
POST   /admin/users/:id/toggle-status
GET    /admin/deposits
POST   /admin/deposits/:id/approve
POST   /admin/deposits/:id/reject
GET    /admin/withdrawals
POST   /admin/withdrawals/:id/approve
POST   /admin/withdrawals/:id/reject
GET    /admin/vip-products
POST   /admin/vip-products
PUT    /admin/vip-products/:id
DELETE /admin/vip-products/:id
GET    /admin/banks
POST   /admin/banks
DELETE /admin/banks/:id
GET    /admin/vip-investments
POST   /admin/vip-investments/:id/toggle-status
GET    /admin/logs
```

---

## ✅ Checklist de Déploiement

- [ ] Tous les endpoints API testés
- [ ] Admin dashboard compilé sans erreurs
- [ ] Règle "Stock épuisé" pour VIP ≥ 100.000 F validée
- [ ] Tous les formulaires CRUD testés
- [ ] Authentification admin vérifiée
- [ ] Logs d'activité enregistrés
- [ ] Dashboard utilisateur avec TeamTab fonctionnel
- [ ] Parrainage et commissions calculées correctement
- [ ] Dépôts et retraits approuvables/rejetables
- [ ] Investissements pausables/annulables
- [ ] Performance testée avec données réelles
- [ ] Sécurité : Les routes admin nécessitent is_admin = true

---

## 📞 Support

Pour toute question ou bug, consultez les logs :
- **Frontend** : Console du navigateur (F12)
- **Backend** : `npm start` affichera les logs en temps réel

Bonne administration ! 🎉
