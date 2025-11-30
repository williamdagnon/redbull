# Tableau de Bord Administrateur Complet

## Vue d'ensemble

Le tableau de bord administrateur offre une gestion complète de l'application avec 7 sections principales.

## Sections du Tableau de Bord

### 1. **Statistiques (Stats)**
Affiche un résumé visuel de toutes les métriques clés:

- **Utilisateurs Total**: Nombre total d'utilisateurs actifs
- **Dépôts Total**: Montant cumulé de tous les dépôts
- **Dépôts En Attente**: Nombre de dépôts en attente d'approbation
- **Retraits Total**: Montant cumulé de tous les retraits
- **Retraits En Attente**: Nombre de retraits en attente d'approbation
- **Investissements Actifs**: Nombre de positions VIP en cours
- **Commissions Total**: Total des commissions versées aux affiliés

### 2. **Dépôts**
Gestion complète des dépôts utilisateur:

**Filtres disponibles:**
- Tous les dépôts
- En Attente d'approbation
- Approuvés
- Rejetés

**Actions:**
- Cliquez sur l'icône ✓ (vert) pour **approuver** un dépôt
  - Ajoute le montant au solde de l'utilisateur
  - Change le statut à "Approuvé"
- Cliquez sur l'icône ✗ (rouge) pour **rejeter** un dépôt
  - Change le statut à "Rejeté"
  - Aucun montant n'est ajouté

**Informations affichées:**
- Numéro de téléphone de l'utilisateur
- Méthode de paiement utilisée
- Montant du dépôt
- Date du dépôt
- Statut actuel

### 3. **Retraits**
Gestion complète des demandes de retrait:

**Filtres disponibles:**
- Tous les retraits
- En Attente d'approbation
- Approuvés
- Rejetés

**Actions:**
- Cliquez sur l'icône ✓ (vert) pour **approuver** un retrait
  - Déduit le montant du solde de l'utilisateur
  - Change le statut à "Approuvé"
- Cliquez sur l'icône ✗ (rouge) pour **rejeter** un retrait
  - Restaure le montant au solde de l'utilisateur
  - Change le statut à "Rejeté"

**Informations affichées:**
- Numéro de téléphone de l'utilisateur
- Banque de destination
- Montant demandé
- Date de la demande
- Statut actuel

### 4. **Utilisateurs**
Gestion complète des comptes utilisateur:

**Fonctionnalités:**
- **Recherche**: Recherchez par numéro de téléphone ou nom d'utilisateur
- **Actualiser**: Chargez les données les plus récentes
- **Status de l'utilisateur**: Indicateur visuel (Actif/Inactif)

**Informations affichées pour chaque utilisateur:**
- Nom complet et numéro de téléphone
- Pays
- Code de parrainage unique
- Date d'inscription
- Solde du portefeuille
- Montant total investi
- Gains totals réalisés

**Actions disponibles:**
- **Bloquer**: Désactiver le compte utilisateur
- **Débloquer**: Réactiver le compte utilisateur

### 5. **VIP (Investissements)**
Suivi des investissements VIP en cours:

**Informations affichées:**
- Numéro de téléphone et nom de l'utilisateur
- Montant investi
- Date de début et de fin du package
- Durée totale en jours
- Statut (Actif, Complété, Annulé)

**Code couleur des statuts:**
- Bleu: Investissement actif
- Vert: Investissement complété
- Gris: Investissement annulé

### 6. **Logs (Journaux d'activité)**
Historique complet de toutes les actions:

**Informations affichées:**
- Action effectuée
- Utilisateur impliqué (si applicable)
- Administrateur ayant effectué l'action
- Détails additionnels
- Horodatage complet

**Filtre automatique:**
Les 200 entrées les plus récentes sont affichées en premier.

### 7. **Paramètres**
Configuration système et informations d'administration:

**Affichage:**
- Compte administrateur actuel
- Permissions disponibles
- Actions pouvant être effectuées

## Fonctionnalités Principales

### Approuver un Dépôt
1. Allez dans **Dépôts**
2. Filtrez par "En Attente" (défaut)
3. Trouvez le dépôt à approuver
4. Cliquez sur l'icône ✓ (vert)
5. Confirmation: Le solde de l'utilisateur est mis à jour
6. Le statut devient "Approuvé"

### Rejeter un Dépôt
1. Allez dans **Dépôts**
2. Cliquez sur l'icône ✗ (rouge)
3. Le statut devient "Rejeté"
4. Aucun montant n'est ajouté au compte

### Approuver un Retrait
1. Allez dans **Retraits**
2. Filtrez par "En Attente" (défaut)
3. Trouvez le retrait à approuver
4. Cliquez sur l'icône ✓ (vert)
5. Confirmation: Le montant est déduit du solde utilisateur
6. Le statut devient "Approuvé"

### Rejeter un Retrait
1. Allez dans **Retraits**
2. Cliquez sur l'icône ✗ (rouge)
3. Le montant est restitué au solde de l'utilisateur
4. Le statut devient "Rejeté"

### Bloquer/Débloquer un Utilisateur
1. Allez dans **Utilisateurs**
2. Trouvez l'utilisateur à gérer
3. Cliquez sur **Bloquer** (pour un utilisateur actif) ou **Débloquer** (pour un utilisateur inactif)
4. Le statut de l'utilisateur change instantanément
5. L'utilisateur ne peut plus accéder à son compte s'il est bloqué

### Rechercher un Utilisateur
1. Allez dans **Utilisateurs**
2. Entrez le numéro de téléphone ou le nom dans la barre de recherche
3. Les résultats se filtrent automatiquement
4. Cliquez sur **Actualiser** pour recharger tous les utilisateurs

## Mise à Jour des Données

- Les données se chargent automatiquement lors du changement d'onglet
- Cliquez sur **Actualiser** (bouton spécifique) pour forcer une mise à jour
- Les compteurs de statistiques se mettent à jour après chaque action

## Sécurité

- Seuls les administrateurs authentifiés peuvent accéder au tableau de bord
- Chaque action est loggée dans le journal d'activité
- Les modifications apportées sont permanentes dans la base de données
- Un token JWT valide est requis pour toutes les opérations

## Conseils d'Utilisation

1. **Vérification des dépôts**: Toujours vérifier les détails avant d'approuver
2. **Gestion des retraits**: S'assurer que l'utilisateur a suffisamment de solde
3. **Monitoring**: Consulter régulièrement les statistiques pour détecter les anomalies
4. **Logs**: Vérifier les logs d'activité pour toute action suspecte
5. **Utilisateurs**: Bloquer les comptes suspects ou inactifs

## Architecture Technique

### Endpoints API Utilisés

- `GET /api/admin/stats` - Statistiques globales
- `GET /api/admin/deposits` - Lister les dépôts
- `POST /api/admin/deposits/:id/approve` - Approuver un dépôt
- `POST /api/admin/deposits/:id/reject` - Rejeter un dépôt
- `GET /api/admin/withdrawals` - Lister les retraits
- `POST /api/admin/withdrawals/:id/approve` - Approuver un retrait
- `POST /api/admin/withdrawals/:id/reject` - Rejeter un retrait
- `GET /api/admin/users` - Lister les utilisateurs
- `POST /api/admin/users/:id/toggle-status` - Bloquer/Débloquer utilisateur
- `GET /api/admin/vip-investments` - Lister les investissements VIP
- `GET /api/admin/logs` - Logs d'activité

### Frontend (React/TypeScript)
- Fichier: `src/components/AdminDashboard.tsx`
- API Client: `src/utils/adminApi.ts`
- État géré avec React Hooks (useState, useEffect)

### Backend (Node.js/Express)
- Routes: `backend/src/routes/admin.routes.ts`
- Middlewares: Authentification et autorisation admin
- Base de données: MySQL avec requêtes paramétrées
- Services: Gestion des transactions et mises à jour

## Résolution des Problèmes

### Les données ne se chargent pas
- Vérifiez la connexion réseau
- Assurez-vous que le token JWT est valide
- Consultez la console du navigateur pour les erreurs

### Erreur "Permission refusée"
- Assurez-vous que le compte est administrateur
- Vérifiez que le token JWT n'a pas expiré
- Reconnectez-vous si nécessaire

### Les changements ne sont pas appliqués
- Cliquez sur le bouton **Actualiser** de la section
- Attendez quelques secondes pour la réplication de la base de données
- Actualisez la page si le problème persiste

## Voir aussi

- [Documentation Backend](./RESUME_IMPLEMENTATION.md)
- [Guide de Configuration](./MYSQL_SETUP.md)
- [Architecture de l'Application](./IMPLEMENTATION.md)
