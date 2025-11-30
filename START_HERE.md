# ⚡ ULTRA-RAPIDE - 2 MINUTES

## 🚀 Lancer

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend  
npm run dev
```

## 🔑 Admin

```sql
-- Base de données
INSERT INTO users (phone, is_admin, full_name, country_code, password_hash)
VALUES ('+212612345678', true, 'Admin', '+212', 'hash_here');
```

```
Login: +212612345678
Pass: ton_mot_de_passe
```

## ✅ Tests Rapides

| Test | Chemin |
|------|--------|
| 1. Créer User | Utilisateurs → + Ajouter → Remplir → Enregistrer |
| 2. Stock Épuisé | Produits VIP → min_amount: 100000 → "Stock épuisé" ✅ |
| 3. Approuver Dépôt | Dépôts → En Attente → ✅ Approuver |
| 4. Pause Invest | Investissements → Actif → ⏸️ Pause |
| 5. Voir Stats | Statistiques → Vérifier chiffres |

## 📚 Docs

- **QUICK_START.md** - 5 min
- **ADMIN_PANEL_GUIDE.md** - 30 min
- **MISSION_COMPLETE.md** - 2 min

## 🆘 Problèmes

| Problème | Solution |
|----------|----------|
| Page blanche | F12 → Console → Vérifier erreurs |
| Admin n'apparaît pas | Vérifier is_admin=true en BD |
| Stock Épuisé absent | min_amount doit être >= 100.000 |
| Données non chargées | Backend lancé ? Port 3000 ? |

## ✅ C'est Tout !

**Prêt pour production ! 🎉**

Consultez **MISSION_COMPLETE.md** pour plus.
