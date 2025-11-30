# Guide Rapide - Tableau de Bord Admin

## 🚀 Démarrage Rapide

### 1. Se Connecter en Tant qu'Admin

```
Téléphone: +1[pays]XXXXXXXXX (votre numéro admin)
Mot de passe: [votre mot de passe admin]
```

L'application détecte automatiquement si le compte est admin et affiche le tableau de bord.

### 2. Interface Principale

Le tableau de bord s'ouvre avec **7 onglets**:

```
[📊 Statistiques] [📈 Dépôts] [📤 Retraits] [👥 Utilisateurs] [👑 VIP] [📋 Logs] [⚙️ Paramètres]
```

## 📊 Section Statistiques

**Ce que vous voyez:**
- 📊 Utilisateurs Total: Nombre complet d'utilisateurs
- 💰 Dépôts Total: Montant cumulé approuvé
- ⏳ Dépôts En Attente: Nombre de dépôts non approuvés
- 💸 Retraits Total: Montant cumulé des retraits approuvés
- ⏳ Retraits En Attente: Nombre de retraits en attente
- 📈 Investissements Actifs: Nombre de packages VIP en cours
- 💎 Commissions Total: Total des commissions versées

**Mise à jour:** Automatique lors de l'accès à cet onglet

## 💰 Section Dépôts

### Filtrer les Dépôts:
```
[Tous] [En Attente] [Approuvés] [Rejetés]
```

### Pour APPROUVER un Dépôt:
1. Vérifiez les détails (téléphone, montant, date)
2. Cliquez l'icône ✓ (bouton vert)
3. ✅ Montant ajouté au portefeuille utilisateur

### Pour REJETER un Dépôt:
1. Cliquez l'icône ✗ (bouton rouge)
2. ✅ Dépôt marqué comme rejeté

**Champs visibles:**
- Téléphone utilisateur
- Méthode de paiement
- Montant
- Date de création
- Statut actuel

## 💸 Section Retraits

### Filtrer les Retraits:
```
[Tous] [En Attente] [Approuvés] [Rejetés]
```

### Pour APPROUVER un Retrait:
1. Vérifiez les détails
2. Cliquez ✓ (vert)
3. ✅ Montant déduit du portefeuille
4. ✅ Statut = Approuvé

### Pour REJETER un Retrait:
1. Cliquez ✗ (rouge)
2. ✅ Montant restitué au portefeuille utilisateur
3. ✅ Statut = Rejeté

**Important:** Le rejet recrédite l'utilisateur!

## 👥 Section Utilisateurs

### Rechercher un Utilisateur:
```
[Champ texte] ← Tapez le téléphone ou nom
```

### Informations Affichées:
- 📱 Nom + Téléphone
- 🌍 Pays (country_code)
- 🎟️ Code de parrainage
- 📅 Date d'inscription
- 💼 **Solde actuel**
- 💳 **Montant investi**
- 📈 **Gains réalisés**
- ✅/❌ **Statut actif/inactif**

### Bloquer un Utilisateur:
1. Localisez l'utilisateur
2. Cliquez **Bloquer** (bouton rouge)
3. ✅ Compte désactivé
4. ✅ Utilisateur ne peut plus se connecter

### Débloquer un Utilisateur:
1. Localisez l'utilisateur inactif
2. Cliquez **Débloquer** (bouton vert)
3. ✅ Compte réactivé
4. ✅ Utilisateur peut se connecter

## 👑 Section VIP

### Voir les Investissements Actifs:
- Affiche tous les packages VIP en cours
- Filtrez par statut: Actif / Complété / Annulé

### Informations par Investissement:
- 👤 Utilisateur (téléphone + nom)
- 💰 Montant investi
- 📅 Date de début
- 📅 Date de fin
- ⏱️ Durée restante en jours
- 🎯 Statut actuel

## 📋 Section Logs

### Journal d'Activité Complet:
Affiche les **200 dernières actions** triées par date

### Informations Loggées:
- 🎬 Action effectuée
- 👤 Utilisateur concerné (si applicable)
- 👨‍💼 Admin ayant effectué l'action
- 📝 Détails supplémentaires
- ⏰ Horodatage exact (date + heure)

### Exemples d'Actions Loggées:
- `deposit_approved` - Dépôt approuvé
- `deposit_rejected` - Dépôt rejeté
- `withdrawal_approved` - Retrait approuvé
- `withdrawal_rejected` - Retrait rejeté
- `user_banned` - Utilisateur bloqué
- `user_unbanned` - Utilisateur débloqué
- `manual_credit` - Crédit manuel
- `manual_debit` - Débit manuel

## ⚙️ Section Paramètres

### Informations Système:
- 👨‍💻 Compte admin actuel
- ✅ Permissions disponibles
- 📋 Liste des actions possibles

## 🔍 Astuces Utiles

### Mise à Jour des Données:
- Les onglets se chargent automatiquement
- Utilisez **Actualiser** (bouton bleu) pour forcer l'actualisation
- Recherchez spécifiquement ce que vous cherchez

### Filtrage:
- **Dépôts**: Filtrez par statut pour approuver les en attente
- **Retraits**: Même chose - approuvez les demandes en attente
- **Utilisateurs**: Recherchez par nom ou téléphone

### Notifications:
- ✅ Messages de succès (vert) après action
- ❌ Messages d'erreur (rouge) si problème
- ⏳ Spinners pendant le chargement

### Sécurité:
- 🔒 Session JWT sécurisée
- 📝 Chaque action est loggée
- 🚨 Les changements sont permanents (confirmez avant!)

## 📱 Utilisation Mobile

- ✅ Interface responsive
- ✅ Onglets scrollables horizontalement
- ✅ Boutons tactiles bien espacés
- ✅ Texte lisible sur petit écran

## ⚡ Opérations Courantes (Rapides)

### Approuver 10 Dépôts:
```
1. Allez dans Dépôts
2. Filtrez par "En Attente"
3. Cliquez ✓ pour chaque dépôt
4. Temps total: 2-3 minutes
```

### Vérifier Activité Récente:
```
1. Allez dans Logs
2. Consultez les 20 premières entrées
3. Temps: 30 secondes
```

### Bloquer Utilisateur Suspect:
```
1. Allez dans Utilisateurs
2. Cherchez par téléphone
3. Cliquez Bloquer
4. Temps: 10 secondes
```

## 🚨 Situations Courantes

### Utilisateur Signale Dépôt Perdu:
```
1. Allez dans Utilisateurs
2. Trouvez l'utilisateur
3. Vérifiez ses dépôts dans "Dépôts"
4. Cherchez un dépôt rejeté
5. Peut faire un nouveau dépôt
```

### Utilisateur Demande Retrait non Approuvé:
```
1. Allez dans Retraits
2. Filtrez par "En Attente"
3. Trouvez sa demande
4. Cliquez ✓ pour approuver
```

### Détecter Activité Suspecte:
```
1. Allez dans Logs
2. Cherchez plusieurs rejets du même utilisateur
3. Allez dans Utilisateurs
4. Considérez bloquer le compte
```

### Vérifier Gains d'un Utilisateur:
```
1. Allez dans Utilisateurs
2. Cherchez l'utilisateur
3. Voir la colonne "Gains" directement
```

## 📊 Lectures Recommandées

Pour plus de détails:
- Voir `ADMIN_DASHBOARD.md` (documentation complète)
- Voir `ADMIN_DASHBOARD_COMPLETE.md` (architecture technique)
- Voir `IMPLEMENTATION.md` (architecture globale)

## ❓ FAQ

**Q: Que se passe-t-il si j'approuve un dépôt par erreur?**
A: Le montant est ajouté. Vous pouvez manuellement réduire le solde via les logs.

**Q: Puis-je modifier les montants?**
A: Non directement, mais via AdminService en backend (voir dev).

**Q: Les actions sont-elles reversibles?**
A: Non - confirmez avant! Chaque action est loggée.

**Q: Combien de temps pour voir les mises à jour?**
A: Immédiat après action - cliquez Actualiser si nécessaire.

---

**Version**: 1.0  
**Mise à jour**: Novembre 2025  
**Statut**: ✅ Production-Ready
