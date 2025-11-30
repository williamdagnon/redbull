# PROCÉDURE DE CORRECTION URGENTE - INTÉGRATION FRONT/BACK

## Résumé des corrections appliquées

✅ **Backend (.env)**: DB_NAME corrigé (apuic_capital), Port 3001, JWT_SECRET sécurisé  
✅ **Schéma SQL**: Suppression des seeds démo (VIP products, banks, config)  
✅ **Auto-création wallet**: Fallback côté app si trigger échoue  
✅ **Signup réel**: Frontend appelle vraiment `/api/auth/signup`  
✅ **Admin setup**: Endpoint `/api/setup/admin-init` pour créer l'admin initial  
✅ **Frontend .env**: VITE_API_URL = http://localhost:3001/api  

---

## ÉTAPES À EXÉCUTER LOCALEMENT (URGENCE)

### Étape 1: Nettoyer et réinstaller le backend

```powershell
cd e:\PROJ\new_project\new\backend
# Supprimer node_modules et package-lock
rm -Recurse -Force node_modules
rm package-lock.json -ErrorAction SilentlyContinue
# Réinstaller
npm install
```

### Étape 2: Exécuter la migration DB (schéma nettoyé sans seeds démo)

```powershell
cd e:\PROJ\new_project\new\backend
npm run migrate
```

**Vérifiez** qu'il n'y a pas d'erreurs (triggers, tables créées correctement).

### Étape 3: Créer l'admin initial (endpoint setup)

Depuis PowerShell, créez l'admin avec curl:

```powershell
curl -X POST http://localhost:3001/api/setup/admin-init `
  -H "Content-Type: application/json" `
  -d '{
    "phone":"22123456789",
    "password":"admin123456",
    "full_name":"Admin",
    "country_code":"TG"
  }'
```

**Attendez la réponse**: `{ success: true, data: { user: {...}, token: "..." } }`

Enregistrez le `token` retourné pour les tests admin (optionnel, déjà géré par login).

### Étape 4: Démarrer le backend en dev

```powershell
cd e:\PROJ\new_project\new\backend
npm run dev
```

**Vérifiez**:
- `✅ MySQL connection established`
- Backend écoute sur port 3001
- Pas d'erreurs JavaScript

### Étape 5: Démarrer le frontend en dev (nouvelle session PowerShell)

```powershell
cd e:\PROJ\new_project\new
npm run dev
```

**Attendez** que le dev server démarre (port 5000 ou autre).

### Étape 6: Tester l'inscription

1. Ouvrez http://localhost:5000 (ou port du frontend)
2. Remplissez le formulaire d'inscription:
   - Pays: Togo
   - Numéro: 12345678 (8 chiffres pour TG)
   - Mot de passe: test123456 (min 6 chars)
   - Pseudo: Test User
   - Code de parrainage: (optionnel)
3. Cliquez "Continuer"
4. **Si succès**: Page "Code de Vérification" avec champ OTP
   - Entrez 6 chiffres aléatoires (ex: 123456)
   - Cliquez "S'inscrire Maintenant"
5. **Si succès**: Page "Inscription Réussie", redirection auto au dashboard

### Étape 7: Tester le login

1. Depuis la page de succès, attendez la redirection au dashboard ou naviguez manuellement
2. Si pas d'accès auto, retournez à "Se Connecter"
3. Entrez le tél. et mot de passe utilisés à l'inscription
4. Cliquez "Se Connecter"
5. **Si succès**: Accès au dashboard utilisateur avec solde wallet, etc.

### Étape 8: Tester le dashboard admin

1. Depuis n'importe où, loggez-vous avec l'admin créé à l'étape 3:
   - Tél: 22123456789
   - Mot de passe: admin123456
2. **Vous devriez voir**: Dashboard admin avec stats (utilisateurs, dépôts, retraits, etc.)
3. Menu admin disponible (gestion utilisateurs, banques, logs, etc.)

---

## DIAGNOSTIQUE EN CAS D'ERREUR

### ❌ "failed to fetch" ou "CORS error"

- **Cause**: Frontend n'arrive pas à joindre le backend
- **Vérification**:
  - Backend tourne sur port 3001 ?
  - `VITE_API_URL` dans `.env` est correct ? (`http://localhost:3001/api`)
  - CORS activé dans `backend/src/index.ts` ? (oui, line 17: `app.use(cors())`)
- **Solution**: Redémarrez backend, puis frontend

### ❌ "User not found" ou "Invalid credentials" au login

- **Cause**: Utilisateur non inséré en DB, ou mauvais hash password
- **Vérification**: 
  - User existe en DB ? Testez via MySQL CLI:
    ```sql
    SELECT id, phone, full_name FROM users ORDER BY created_at DESC LIMIT 5;
    ```
  - Migration a réussi sans erreurs ?
  - Logs backend affichent d'autres erreurs ?
- **Solution**: Vérifiez les logs backend, relancez migration si tables absentes

### ❌ "Failed to create wallet"

- **Cause**: Trigger n'a pas créé le wallet, et fallback app a aussi échoué
- **Vérification**:
  - Table `wallets` existe ? (Migration a réussi ?)
  - Logs backend affichent quelle erreur SQL ?
- **Solution**: 
  - Relancez `npm run migrate`
  - Ou créez manuellement un wallet via MySQL:
    ```sql
    INSERT INTO wallets (id, user_id, balance, total_invested, total_earned, total_withdrawn)
    VALUES (UUID(), '<user-id-from-users-table>', 0, 0, 0, 0);
    ```

### ❌ Admin dashboard inaccessible après login

- **Cause**: User n'est pas marqué `is_admin = TRUE` en DB
- **Vérification**: 
  ```sql
  SELECT id, phone, is_admin FROM users WHERE phone = '22123456789';
  ```
  Vérifie que `is_admin = 1` (ou TRUE)
- **Solution**: 
  - Relancez l'endpoint setup pour créer un nouvel admin
  - Ou manuellement via SQL:
    ```sql
    UPDATE users SET is_admin = TRUE WHERE phone = '<phone>';
    ```

### ❌ "Inscription réussie" mais utilisateur absent en DB

- **Cause**: INSERT users a échoué silencieusement (DB error non propagée au front)
- **Vérification**: Logs backend:
  - "UserService.createUser - INSERT users failed:" ?
  - "Execute error:" avec le SQL et les params ?
- **Solution**: Affichez les logs complets du backend (stdout/stderr), correlez avec l'erreur SQL

---

## VÉRIFICATIONS ESSENTIELLES (CHECKLIST)

- [ ] `.env` backend: DB_NAME = apuic_capital, PORT = 3001, JWT_SECRET rempli
- [ ] `.env` frontend: VITE_API_URL = http://localhost:3001/api
- [ ] Migration DB réussie (pas d'erreurs SQL)
- [ ] Backend démarre sans erreurs (testConnection OK)
- [ ] Admin créé via `/api/setup/admin-init`
- [ ] Signup frontend → user créé en DB
- [ ] Login avec cet user → access token reçu
- [ ] Admin login → dashboard admin accessible

---

## NETTOYAGE / RESET BD

Si vous voulez repartir de zéro:

```sql
-- Depuis MySQL CLI
DROP DATABASE IF EXISTS apuic_capital;
CREATE DATABASE apuic_capital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE apuic_capital;
-- Puis relancer npm run migrate
```

Ou depuis PowerShell (si mysql accessible):

```powershell
mysql -u root -h 127.0.0.1 -e "DROP DATABASE IF EXISTS apuic_capital; CREATE DATABASE apuic_capital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Puis:

```powershell
cd e:\PROJ\new_project\new\backend
npm run migrate
```

---

## RÉSUMÉ ARCHITECTURE (après corrections)

```
Frontend (React/Vite) ←→ Backend (Express/Node)
  port 5000/dev           port 3001
     ↓                        ↓
  .env (VITE_API_URL)    .env (DB_*, JWT_*)
     ↓                        ↓
  /api/auth/signup    →  user.service.ts
  /api/auth/login     →  auth.routes.ts + middleware
  /api/admin/*        →  admin.routes.ts (requireAdmin)
     ↓                        ↓
  localStorage (token)  MySQL (apuic_capital)
                           ↓
                        tables: users, wallets, 
                        vip_investments, deposits,
                        withdrawals, banks, etc.
```

---

## POINTS CLÉS DES CORRECTIONS

1. **DB_NAME** au bon endroit (apuic_capital)
2. **Pas de seeds démo** → base vierge, données créées via app
3. **Wallet fallback** → créé côté app si trigger échoue
4. **Signup réel** → frontend appelle /api/auth/signup, pas simulation
5. **Admin setup** → endpoint `/api/setup/admin-init` pour initialiser
6. **Frontend .env** → VITE_API_URL pointe le vrai backend
7. **Auto-fill OTP désactivé par défaut** → activable avec VITE_DEV_AUTO_FILL_OTP=true

---

## CONTACT / DEBUG

Si problème persiste:
- Partagez les **logs complets du backend** (lors de signup/login)
- Logs browser (F12 → Console)
- Résultat de requêtes MySQL (users créés ? wallets créés ?)
- Message d'erreur exact

**L'urgence est levée une fois que: signup works → login works → admin dashboard accessible** ✅
