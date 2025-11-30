# ⚡ VALIDATION RAPIDE - 5 MINUTES

## 🚀 Commencer

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend  
npm run dev

# Accéder: http://localhost:5173
```

---

## ✅ TEST 1 - Vrais Produits VIP (1 min)

1. **Login** → Tout compte
2. **Onglet VIP**
3. **Vérifier**: 10 produits affichés dynamiquement ✓

**Checklist:**
- [ ] Produits chargés de l'API ✓
- [ ] Noms, prix, % visibles ✓

---

## ✅ TEST 2 - Stock Épuisé (1 min)

1. **Rester sur VIP**
2. **Chercher**: "VIP Diamond" (100K)
3. **Vérifier**: Badge 🔴 "Stock épuisé"
4. **Cliquer**: Rien ne se passe ✓

**Checklist:**
- [ ] Badge rouge visible ✓
- [ ] Bouton désactivé ✓
- [ ] Min >= 100K = bloqué ✓

---

## ✅ TEST 3 - Banques Dynamiques (1 min)

1. **Portefeuille** → **Nouveau dépôt**
2. **Montant**: 5000
3. **Suivant** → **Sélectionner banque**
4. **Vérifier**: Vraies banques s'affichent ✓

**Checklist:**
- [ ] Banques chargées de la BD ✓
- [ ] Noms réels visibles ✓

---

## ✅ TEST 4 - Lien de Parrainage (1 min)

1. **Équipe tab**
2. **Vérifier**: Lien avec domaine + code ✓
   ```
   http://localhost:5173?ref=CODE123
   ```
3. **Copier**: Bouton copie fonctionne ✓
4. **Partager**: Bouton partage fonctionne ✓

**Checklist:**
- [ ] Lien dynamique correct ✓
- [ ] Copie fonctionne ✓
- [ ] Partage fonctionne ✓

---

## ✅ TEST 5 - Code Auto-Rempli (1 min)

1. **Copier le lien** depuis Équipe
2. **Incognito window**
3. **Ouvrir le lien**: `?ref=CODE123`
4. **Vérifier**: Champ "Code parrainage" = CODE123 ✓

**Checklist:**
- [ ] Param URL extrait ✓
- [ ] Champ pré-rempli ✓

---

## ✅ TEST 6 - Admin Panel (1 min)

> **Note:** Besoin d'un compte admin (is_admin=true en BD)

1. **Login** avec compte admin
2. **Auto-redirection** vers Admin Dashboard ✓
3. **Tester**: Cliquer quelques boutons
   - [ ] Utilisateurs
   - [ ] VIP Products
   - [ ] Dépôts
   - [ ] Statistiques

**Checklist:**
- [ ] Panel chargé ✓
- [ ] Onglets fonctionnent ✓
- [ ] Pas d'erreurs ✓

---

## 📊 RÉSUMÉ

| Test | Status | Temps |
|------|--------|-------|
| 1. Vrais VIP | ✅ | 1 min |
| 2. Stock épuisé | ✅ | 1 min |
| 3. Banques | ✅ | 1 min |
| 4. Lien parrainage | ✅ | 1 min |
| 5. Code auto-rempli | ✅ | 1 min |
| 6. Admin Panel | ✅ | 1 min |
| **TOTAL** | ✅ | **5 min** |

---

## 🚨 Si un test échoue

### Test 1: Produits ne chargent pas
```
→ Vérifier: GET http://localhost:3000/api/vip/products
→ BD: SELECT COUNT(*) FROM vip_products WHERE is_active = true;
```

### Test 2: Stock épuisé n'apparaît pas
```
→ Vérifier: min_amount >= 100000 pour Diamond+
→ BD: SELECT * FROM vip_products WHERE level >= 5;
```

### Test 3: Banques ne chargent pas
```
→ Vérifier: GET http://localhost:3000/api/deposits/banks
→ BD: SELECT COUNT(*) FROM banks WHERE is_active = true;
```

### Test 4: Lien ne contient pas le domaine
```
→ Vérifier: window.location.origin en console (F12)
→ Attendu: http://localhost:5173 (ou https://domaine.com prod)
```

### Test 5: Code ne pré-remplit pas
```
→ Ouvrir: http://localhost:5173?ref=TEST
→ Console F12: new URLSearchParams(window.location.search).get('ref')
→ Attendu: "TEST"
```

### Test 6: Admin Panel ne charge pas
```
→ Vérifier: is_admin = true pour votre compte en BD
→ Vérifier: Token valide (F12 → Application → auth_token)
→ Logs: npm run dev (backend)
```

---

## ✅ SI TOUS LES TESTS PASSENT

🎉 **Toutes les corrections sont validées!**

```
npm run build
# Déployer sur production
```

---

**Durée totale:** ⏱️ **5 minutes**  
**Prêt pour:** ✅ **Production**
