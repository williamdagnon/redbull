# 📚 DÉTAILS TECHNIQUES DES 6 CORRECTIONS

## 1. VRAIS PRODUITS VIP

### Changements Frontend
```tsx
// Dashboard.tsx - Ajout état
const [vipProducts, setVipProducts] = useState<any[]>([]);

// loadWallet() - Charger produits VIP
const vipResp = await api.getVIPProducts();
if (vipResp.success && vipResp.data) {
  setVipProducts(vipResp.data as any[]);
}

// Rendu VIP showcase et VIP tab
{(vipProducts.length > 0 ? vipProducts : VIP_LEVELS).slice(0, 4).map(level => (
  <VIPCard key={level.level} level={level} ... />
))}
```

### API Endpoint Existant
```
GET /api/vip/products
Response: VIPProduct[]
```

### Backend Service
```typescript
// vip.service.ts
async getVIPProducts(): Promise<VIPProduct[]> {
  const products = await query<VIPProduct>(
    'SELECT * FROM vip_products WHERE is_active = TRUE ORDER BY level ASC'
  );
  return products || [];
}
```

---

## 2. STOCK ÉPUISÉ (MIN >= 100.000 F)

### Changements Frontend - VIPCard.tsx
```tsx
// Ajouter logique
const isOutOfStock = level.min_amount >= 100000;

// Rendu badge
{isOutOfStock && (
  <div className="absolute top-0 left-0 right-0 bg-red-600 text-white">
    <AlertCircle className="w-4 h-4" />
    <span>Stock épuisé</span>
  </div>
)}

// Bouton
<button disabled={!canAfford || isOutOfStock}>
  {isOutOfStock ? 'Stock épuisé' : ...}
</button>
```

### Backend Validation
```typescript
// vip.service.ts - purchaseVIP()
if (parseFloat(product.min_amount.toString()) >= 100000) {
  throw new Error('Stock épuisé');
}
```

### Base de Données
```sql
-- Produits affectés
SELECT * FROM vip_products WHERE min_amount >= 100000;
-- Diamond (100K), Elite (250K), Master (500K), etc.
```

---

## 3. BANQUES DYNAMIQUES

### Nouvelle Route Backend
```typescript
// backend/src/routes/deposit.routes.ts
router.get('/banks', authenticate, async (req: AuthRequest, res) => {
  try {
    const banks = await withdrawalService.getBanks();
    res.json({ success: true, data: banks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Service Backend
```typescript
// withdrawal.service.ts
async getBanks(): Promise<Bank[]> {
  const banks = await query<Bank>(
    'SELECT * FROM banks WHERE is_active = TRUE ORDER BY name ASC'
  );
  return banks || [];
}
```

### Frontend - DepositFormNew.tsx
```tsx
// Changer l'appel API
useEffect(() => {
  if (step === 'bank') {
    const res = await api.request<any>('/deposits/banks');
    if (res?.success) setBanks(res.data || []);
  }
}, [step]);
```

### API Endpoints
```
GET /api/deposits/banks      → Banques pour dépôts
GET /api/withdrawals/banks   → Banques pour retraits
Tous deux chargent depuis: SELECT * FROM banks WHERE is_active = TRUE
```

---

## 4. PARRAINAGE: 30%/3%/3%

### Constantes Backend - utils/constants.ts
```typescript
export const REFERRAL_RATES = {
  level1: 0.30,  // 30% pour le parrain direct
  level2: 0.03,  // 3% pour le parrain du parrain
  level3: 0.03,  // 3% pour le parrain du parrain du parrain
};
```

### Constantes Frontend - constants/index.ts
```typescript
export const REFERRAL_RATES = {
  level1: 0.30,  // 30%
  level2: 0.03,  // 3%
  level3: 0.03,  // 3%
};
```

### Service Parrainage
```typescript
// backend/src/services/referral.service.ts

async processReferralCommissions(
  userId: string, 
  depositId: string, 
  depositAmount: number
): Promise<void> {
  const referrerChain = await this.getReferrerChain(userId, 3);
  
  for (let i = 0; i < referrerChain.length && i < 3; i++) {
    const referrerId = referrerChain[i];
    const level = (i + 1) as 1 | 2 | 3;
    
    const rate = level === 1 ? REFERRAL_RATES.level1 :
                 level === 2 ? REFERRAL_RATES.level2 :
                 REFERRAL_RATES.level3;
    
    const commissionAmount = depositAmount * rate;
    
    // Créer et payer la commission
    const commission = await createCommission(...);
    await this.payCommission(commission.id);
  }
}

async payCommission(commissionId: string): Promise<void> {
  // 1. Ajouter au solde du parrain
  await this.walletService.updateBalance(commission.referrer_id, commission.amount, 'add');
  
  // 2. Mettre à jour les stats du portefeuille
  await this.walletService.updateWalletStats(...);
  
  // 3. Enregistrer la transaction
  await this.walletService.addTransaction(...);
  
  // 4. Marquer la commission comme payée
  await execute("UPDATE referral_commissions SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = $1");
}
```

### Flux d'Activation
```
1. Utilisateur B s'inscrit avec referral_code de A
   referred_by = A.id
   
2. B effectue son premier dépôt (5000 FCFA)
   
3. Admin approuve le dépôt
   → POST /api/deposits/{id}/approve
   → Déclenche processReferralCommissions(B.id, depositId, 5000)
   
4. Commissions calculées et distribuées:
   A reçoit: 5000 * 0.30 = 1500 FCFA (Niveau 1)
   Parrain de A reçoit: 5000 * 0.03 = 150 FCFA (Niveau 2)
   Parrain du parrain de A reçoit: 5000 * 0.03 = 150 FCFA (Niveau 3)
   
5. Crédité immédiatement au solde + transaction enregistrée
```

---

## 5. LIEN DYNAMIQUE + COPIE/PARTAGE

### Frontend - TeamTab.tsx
```tsx
// État du lien
const [referralLink, setReferralLink] = useState<string>('');

// Génération du lien dynamique
useEffect(() => {
  if (referralCode) {
    const domain = window.location.origin;  // http://localhost:5173 ou https://domaine.com
    setReferralLink(`${domain}?ref=${referralCode}`);
  }
}, []);

// Fonctions utilitaires
const copyToClipboard = (text: string | null | undefined) => {
  if (!text) return;
  navigator.clipboard.writeText(text);
  toast.success('Code copié !');
};

// Boutons de copie/partage
<button onClick={() => copyToClipboard(referralCode)}>
  <Copy className="w-5 h-5" />  {/* Copier le code */}
</button>

<button onClick={() => copyToClipboard(referralLink)}>
  <Copy className="w-5 h-5" />  {/* Copier le lien */}
</button>

{navigator.share && (
  <button onClick={() => {
    navigator.share({
      title: 'APUIC Capital - Parrainage',
      text: 'Rejoins-moi sur APUIC Capital et gagnons ensemble !',
      url: referralLink
    });
  }}>
    Partager
  </button>
)}
```

### Formats
```
Code de parrainage:
ABC123DEF456

Lien de parrainage (DEV):
http://localhost:5173?ref=ABC123DEF456

Lien de parrainage (PROD):
https://apuic-capital.com?ref=ABC123DEF456

API (Web Share):
{
  title: "APUIC Capital - Parrainage",
  text: "Rejoins-moi sur APUIC Capital et gagnons ensemble !",
  url: "https://apuic-capital.com?ref=ABC123DEF456"
}
```

---

## 6. CODE AUTO-REMPLI À L'INSCRIPTION

### Frontend - SignupForm.tsx
```tsx
// Nouvel useEffect pour extraire le param ref de l'URL
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');
  if (refCode) {
    setReferralCode(refCode.toUpperCase());
  }
}, []);  // Exécuté une fois au montage

// Dans la soumission du formulaire
const response = await api.signup({
  phone: phoneNumber,
  password,
  full_name: fullName,
  country_code: selectedCountry.code,
  referral_code: referralCode || undefined  // Inclut le code pré-rempli
});
```

### Backend - UserService.ts
```typescript
async createUser(
  data: { phone: string; password: string; full_name: string; country_code: CountryCode },
  referralCode?: string
): Promise<{ user: User; wallet: Wallet }> {
  // 1. Générer un code de parrainage unique pour le nouvel utilisateur
  const newReferralCode = generateUniqueReferralCode();
  
  // 2. Si referralCode fourni, le valider et le lier
  let referredById = null;
  if (referralCode) {
    const referrer = await queryOne<User>(
      'SELECT id FROM users WHERE referral_code = $1',
      [referralCode]
    );
    if (referrer) {
      referredById = referrer.id;
    }
  }
  
  // 3. Créer l'utilisateur
  await execute(
    'INSERT INTO users (..., referred_by, referral_code) VALUES (...)',
    [..., referredById, newReferralCode]
  );
}
```

### Flux Complet
```
1. Parrain A génère le lien:
   domaine.com?ref=CODEA

2. Parrain A partage le lien avec filleul B

3. B clique le lien:
   → Frontend extrait param ?ref=CODEA
   → setReferralCode('CODEA')
   → Champ pré-rempli avec CODEA

4. B remplit le formulaire:
   - Téléphone: +22261234567
   - Mot de passe: Password123
   - Nom: Jean Dupont
   - Code parrainage: CODEA ← Pré-rempli ✓
   - Cliquer "S'inscrire"

5. Backend reçoit:
   {
     phone: '+22261234567',
     password: 'Password123',
     full_name: 'Jean Dupont',
     country_code: '+226',
     referral_code: 'CODEA'
   }

6. Vérification et liaison:
   - Trouver l'utilisateur avec referral_code = 'CODEA' (c'est A)
   - Créer B avec referred_by = A.id
   - B possède maintenant le lien de parrainage vers A

7. Après le premier dépôt de B:
   - Commissions automatiquement distribuées à A, A's referrer, etc.
```

### Requête SQL Vérification
```sql
-- Voir la chaîne de parrainage
SELECT 
  b.id as 'B (Filleul)',
  b.referral_code as 'Code de B',
  b.referred_by as 'Parrain A (ID)',
  a.referral_code as 'Code de A',
  a.referred_by as 'Parrain de A (ID)'
FROM users b
LEFT JOIN users a ON b.referred_by = a.id
WHERE b.phone = '+22261234567';

-- Voir les commissions
SELECT * FROM referral_commissions WHERE referrer_id = a.id;
```

---

## 🔄 FLUX INTÉGRÉ COMPLET

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUX PARRAINAGE COMPLET                 │
└─────────────────────────────────────────────────────────────┘

1. PARRAIN A GÉNÈRE LE LIEN
   A va dans "Équipe"
   → Voit son code: CODEA123
   → Copie le lien: domaine.com?ref=CODEA123
   → Le partage avec B (SMS, WhatsApp, etc.)

2. FILLEUL B ACCÈDE AU LIEN
   B clique sur le lien
   → Frontend extrait ?ref=CODEA123
   → Redirige vers SignupForm
   → Champ "Code de parrainage" pré-rempli: CODEA123

3. B COMPLÈTE L'INSCRIPTION
   B remplit le formulaire:
   - Téléphone: +22261234567
   - Mot de passe: Password123
   - Nom: Jean Dupont
   - Code parrainage: CODEA123 (auto-rempli ✓)
   → Cliquer "S'inscrire"

4. CRÉATION DU COMPTE
   Backend:
   - Génère referral_code pour B: CODEB456
   - Lie B à A: B.referred_by = A.id
   - Crée le portefeuille de B
   - Retour: token + user + wallet

5. PREMIER DÉPÔT DE B
   B va dans "Mon Portefeuille" → "Nouveau dépôt"
   - Montant: 5000 FCFA
   - Banque: Bank of Africa
   - Compte: 1234567890
   - Soumettre

6. ADMIN APPROUVE
   Admin Panel → "Dépôts"
   → Trouver demande de B
   → Cliquer "✅ Approuver"

7. COMMISSIONS DISTRIBUÉES AUTOMATIQUEMENT
   Backend déclenche: processReferralCommissions(B.id, deposit.id, 5000)
   
   Calcul:
   - Trouvé A (level 1, referrer de B): 5000 * 0.30 = 1500 FCFA ✓
   - Trouvé A's referrer (level 2): 5000 * 0.03 = 150 FCFA ✓
   - Trouvé A's referrer's referrer (level 3): 5000 * 0.03 = 150 FCFA ✓
   
   Crédité au solde:
   - A.wallet.balance += 1500
   - A's referrer.wallet.balance += 150
   - A's referrer's referrer.wallet.balance += 150
   
   Transactions enregistrées:
   - INSERT INTO transactions (type='commission', amount=1500, ...)
   - INSERT INTO referral_commissions (status='paid', ...)

8. VÉRIFICATION POUR A
   A va dans "Équipe"
   → Voit ses nouvelles commissions:
     - Niveau 1: +1500 FCFA (de B)
     - Niveau 2: +150 FCFA (de B's referred)
     - Niveau 3: +150 FCFA (de B's referred's referred)
   → Solde augmenté automatiquement
```

---

## ✅ RÉSUMÉ INTÉGRATION

| Correction | Backend | Frontend | BD | Statut |
|-----------|---------|----------|-----|--------|
| Vrais VIP | ✅ GET /vip/products | ✅ loadWallet() + setState | ✅ SELECT FROM vip_products | ✅ |
| Stock épuisé | ✅ Validation >= 100K | ✅ isOutOfStock logic | ✅ min_amount >= 100000 | ✅ |
| Banques | ✅ GET /deposits/banks | ✅ api.request('/deposits/banks') | ✅ SELECT FROM banks | ✅ |
| Parrainage 30/3/3 | ✅ ReferralService rates | ✅ REFERRAL_RATES const | ✅ referral_commissions table | ✅ |
| Lien dynamique | ✅ N/A | ✅ window.location.origin + URLSearchParams | ✅ referral_code column | ✅ |
| Code auto-rempli | ✅ Accepte referral_code | ✅ useEffect URLSearchParams | ✅ users.referred_by column | ✅ |

---

**Tous les systèmes sont interconnectés et fonctionnels!** 🎉
