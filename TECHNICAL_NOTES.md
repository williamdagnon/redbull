# 🔧 Notes Techniques Détaillées

**Date:** 28 novembre 2025  
**Audience:** Développeurs  
**Niveau:** Intermédiaire-Avancé

---

## 🏗️ Architecture

### Frontend Flow
```
RechargePage (collecte montant)
    ↓ props: amount, payWay
Payment (wizard 3 étapes)
    ├─ Step 1: Mobile (6-8 digits)
    ├─ Step 2: Account + USSD + Transfer ID
    └─ Step 3: Récapitulatif
    ↓ POST /recharge
Backend Route (validation strict)
    ↓
Database (deposits + transactions)
    ↓
Redirect home (?deposit_success=1)
```

### State Management (Payment.tsx)
```typescript
const [currentStep, setCurrentStep] = useState(1);
const [customerMobile, setCustomerMobile] = useState("");
const [transferId, setTransferId] = useState("");

// Computed values (from props)
const [amount] = useState(initialAmount ?? 5000);
const isAmountValid = amount >= minDeposit;

// Derived: display values
const displayMobile = `+229 ${customerMobile}`;
```

---

## 🔍 Validation Patterns

### Mobile Format
```typescript
// Frontend (UX)
const isValid = /^\d{6,8}$/.test(customerMobile);
const input = (e) => setCustomerMobile(e.target.value.replace(/\D/g, ''));

// Backend (Security)
if (!customer_mobile || !/^\d{6,8}$/.test(String(customer_mobile))) {
  throw Error('Numéro mobile invalide (6-8 chiffres)');
}
```

### Transfer ID Format
```typescript
// Frontend (UX)
const isValid = /^\d{9,11}$/.test(transferId);
const input = (e) => setTransferId(e.target.value.replace(/\D/g, ''));

// Backend (Security)
if (!transfer_id || !/^\d{9,11}$/.test(String(transfer_id))) {
  throw Error('ID de transfert invalide (9-11 chiffres)');
}
```

### Amount Validation (Multi-Level)
```typescript
// Frontend Level 1: Display
const isAmountValid = amount >= minDeposit;

// Frontend Level 2: Before submit
if (!isAmountValid) {
  throw Error(`Montant minimum : ${minDeposit} XOF`);
}

// Backend Level 1: Platform minimum
if (numericAmount < PLATFORM_CONFIG.minDeposit) {
  throw Error(`Montant minimum : ${PLATFORM_CONFIG.minDeposit} XOF`);
}

// Backend Level 2: Method minimum
if (numericAmount < methodMinDeposit) {
  throw Error(`Montant minimum pour cette méthode : ${methodMinDeposit} XOF`);
}
```

---

## 💾 Database Design

### Table: payment_methods
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE,        -- 'tmoney', 'moov', etc.
  name VARCHAR(255),              -- 'TMoney', 'Moov Money'
  description TEXT,               -- Display description
  account_holder_name VARCHAR,    -- "Company Ltd"
  account_number VARCHAR(100),    -- "0011222333"
  ussd_code VARCHAR(50),          -- "*145#" ← NEW
  min_deposit NUMERIC(14,2),      -- 1000 (minimum)
  is_active BOOLEAN,              -- true/false
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Table: deposits (modified)
```sql
CREATE TABLE deposits (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC(14,2),
  payment_method VARCHAR,         -- From payment_methods.name
  account_number VARCHAR(100),    -- STORED: user mobile (95123456)
  transaction_id VARCHAR,         -- "I{timestamp}"
  transfer_id VARCHAR,            -- STORED: user's transfer ID (123456789)
  receipt_url TEXT,
  status ENUM ('pending', 'approved', 'rejected'), -- ← KEY: 'pending' initially
  is_first_deposit BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  CHECK (status IN ('pending', 'approved', 'rejected'))
);
```

### Table: transactions (no change)
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR,                   -- 'deposit'
  amount NUMERIC(14,2),
  status ENUM ('pending', 'completed', 'failed'), -- ← 'pending' initially
  description TEXT,
  reference_id UUID,              -- FOREIGN: deposits.id
  created_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reference_id) REFERENCES deposits(id)
);
```

---

## 🔄 API Payload Flow

### Request (Frontend → Backend)
```json
{
  "amount": 5000,
  "pay_way_id": "tmoney-uuid",
  "transfer_id": "123456789",
  "customer_mobile": "95123456"
}
```

### Response (Success)
```json
{
  "status": 1,
  "msg": "Dépôt créé et en attente d'approbation",
  "result": {
    "depositId": "550e8400-e29b-41d4-a716-446655440000",
    "orderCode": "I1700000000000"
  }
}
```

### Response (Error: Montant invalide)
```json
{
  "status": 0,
  "msg": "Montant minimum : 1000 XOF"
}
```

---

## 🧩 Component Props

### Payment.tsx
```typescript
interface PaymentProps {
  amount?: number;                  // Ex: 5000
  payWay?: string | number | null;  // Ex: "tmoney" or UUID
  accountNumber?: string;           // Ex: "0011222333"
  accountHolderName?: string;       // Ex: "Company Ltd"
  ussdCode?: string;                // Ex: "*145#" ← NEW
  minDeposit?: number;              // Ex: 1000 ← NEW
}
```

### RechargePage → Payment Props
```typescript
<Payment 
  amount={amount}
  payWay={payWay}
  accountNumber={selectedMethod?.account_number || ''}
  accountHolderName={selectedMethod?.account_holder_name || ''}
  ussdCode={selectedMethod?.ussd_code || ''}           // ← NEW
  minDeposit={selectedMethod?.min_deposit ? 
    Number(selectedMethod.min_deposit) : 1000}         // ← NEW
/>
```

---

## 🔗 Request Lifecycle

### 1. User Enters Data (Frontend)
```typescript
Step 1:
- customerMobile = "95123456"
- Input filtered: replace(/\D/g, '')
- Validation: /^\d{6,8}$/ → true

Step 2:
- transferId = "123456789"
- Validation: /^\d{9,11}$/ → true

Step 3:
- User clicks "Soumettre"
```

### 2. Prepare Payload (Frontend)
```typescript
const payload = {
  amount: 5000,                      // From RechargePage state
  pay_way_id: payWay,                // From RechargePage props
  transfer_id: transferId,           // From Payment state
  customer_mobile: customerMobile    // From Payment state
};

// Send via postJSON helper
const res = await postJSON('/recharge', payload);
```

### 3. Backend Authentication
```typescript
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;  // From JWT token
  // ...
});
```

### 4. Backend Validation
```typescript
// 1. Extract & validate request body
const { amount, pay_way_id, transfer_id, customer_mobile } = req.body;

// 2. Type conversion
const numericAmount = Number(amount);

// 3. Multi-level validation
if (numericAmount < PLATFORM_CONFIG.minDeposit) { /* ... */ }
if (!/^\d{6,8}$/.test(String(customer_mobile))) { /* ... */ }
if (!/^\d{9,11}$/.test(String(transfer_id))) { /* ... */ }

// 4. Resolve payment method
const pm = await query(`SELECT * FROM payment_methods WHERE id = $1`, [pay_way_id]);
const paymentMethodName = pm[0].name;

// 5. Check if first deposit
const prev = await query(`SELECT id FROM deposits WHERE user_id = $1 ...`);
const isFirstDeposit = !prev || prev.length === 0;
```

### 5. Create Database Records
```typescript
// 1. Create deposit (PENDING status!)
await execute(
  `INSERT INTO deposits (..., status, ...) VALUES (..., $9, ...)`,
  [depositId, userId, amount, paymentMethodName, 
   customer_mobile, orderCode, transfer_id, null, 'pending', isFirstDeposit]
);

// 2. Create transaction (PENDING status!)
await execute(
  `INSERT INTO transactions (..., status, ...) VALUES (..., $5, ...)`,
  [txId, userId, 'deposit', amount, 'pending', '...', depositId]
);
```

### 6. Return Success
```typescript
return res.json({
  status: 1,
  msg: 'Dépôt créé et en attente d\'approbation',
  result: { depositId, orderCode }
});
```

### 7. Frontend Redirect
```typescript
if (res && res.status === 1) {
  showMessage('✓ Dépôt soumis pour approbation');
  setTimeout(() => {
    window.location.href = '/?deposit_success=1';
  }, 1500);
}
```

---

## 🔑 Key Features

### Feature 1: Mobile Format (6-8 Digits)
**Why:** Different users have different mobile lengths; some 6, some 8 digits
**Impact:** Flexibility without compromising security

**Implementation:**
- Frontend: `replace(/\D/g, '')` removes non-digits
- Frontend: `/^\d{6,8}$/` validates length
- Backend: Same validation
- Display: `+229 95123456` (code added in display layer)

### Feature 2: USSD from Admin
**Why:** Different payment methods have different USSD codes
**Impact:** Admin can configure without code changes

**Implementation:**
- Migration: `ALTER TABLE payment_methods ADD ussd_code VARCHAR(50)`
- Seed: Update with default codes
- Frontend: Pass from `selectedMethod?.ussd_code`
- Backend: Retrieved if needed (currently frontend displays)

### Feature 3: Minimum Amount Validation
**Why:** Platform + Method can have different minimums
**Impact:** Flexible business rules

**Implementation:**
- Frontend: Display + Block if invalid
- Backend: Validate both levels
- Database: `payment_methods.min_deposit` configurable per method

### Feature 4: Pending Approval
**Why:** Risk mitigation - admin verifies before credit
**Impact:** Prevents fraud/errors affecting user wallets

**Implementation:**
- Database: `deposits.status = 'pending'` (not 'approved')
- Database: `transactions.status = 'pending'`
- Workflow: Admin approves → updates status → credits wallet
- Audit: `transfer_id` stored for traceability

---

## 🧪 Testing Strategy

### Unit Tests (Frontend)
```typescript
describe('Payment Step 1', () => {
  it('should accept 6-digit mobile', () => {
    // setCustomerMobile('95123') → NO
    // setCustomerMobile('951234') → YES
  });
  
  it('should accept 8-digit mobile', () => {
    // setCustomerMobile('95123456') → YES
  });
  
  it('should reject 9-digit mobile', () => {
    // setCustomerMobile('951234567') → NO
  });
});
```

### Integration Tests (E2E)
```
1. User logs in → Dashboard
2. Click Recharge → RechargePage
3. Select amount 5000 → Payment Step 1
4. Enter mobile 95123456 → Click Next
5. Verify Step 2 UI (account + USSD visible)
6. Enter transfer ID 123456789 → Click Next
7. Verify Step 3 recap
8. Click Soumettre → POST /recharge
9. Verify response { status: 1, ... }
10. Verify DB: deposits.status='pending'
11. Verify redirect to /?deposit_success=1
```

### API Tests (Backend)
```bash
# Valid request
POST /recharge
{ amount: 5000, pay_way_id: '...', transfer_id: '123456789', customer_mobile: '95123456' }
→ 200 { status: 1, msg: '...' }

# Invalid mobile
POST /recharge
{ ..., customer_mobile: '95123' }
→ 400 { status: 0, msg: 'Numéro mobile invalide...' }
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "ussd_code column does not exist"
**Cause:** Migration not applied
**Fix:** `psql -U postgres -d db -f backend/src/db/add_ussd_code.sql`

### Issue 2: Mobile showing "+229 undefined"
**Cause:** `ussdCode` prop not passed
**Fix:** Verify RechargePage passes `ussdCode={selectedMethod?.ussd_code || ''}`

### Issue 3: Transfer ID validation failing on backend
**Cause:** Transfer ID contains non-digits
**Fix:** Frontend filters with `replace(/\D/g, '')` - ensure input type is text

### Issue 4: Deposit auto-approving (wallet credited)
**Cause:** Old workflow with auto-approval
**Fix:** Verify backend creates with `status = 'pending'` (not 'approved')

---

## 📈 Performance

### Database Queries
```sql
-- Fast (indexed by user_id)
SELECT id FROM deposits WHERE user_id = $1 AND status IN ('approved', 'pending') LIMIT 1;

-- Fast (indexed by id, PK)
SELECT * FROM payment_methods WHERE id = $1 LIMIT 1;

-- Reasonable (2 inserts per request)
INSERT INTO deposits (...) VALUES (...);
INSERT INTO transactions (...) VALUES (...);
```

### API Response Time
- Frontend validation: ~0ms (local)
- Network: ~50-200ms (depends on latency)
- Backend validation: ~10-50ms
- Database: ~50-100ms (2 queries + 2 inserts)
- **Total:** ~150-400ms

### Frontend Rendering
- Payment component: React re-render ~1ms
- UI updates: instant (useState)
- Redirect: 1.5s delay (intentional for UX)

---

## 🔐 Security Deep Dive

### Input Sanitization
```typescript
// Frontend
setCustomerMobile(e.target.value.replace(/\D/g, ''))  // Only digits

// Backend
const regex = /^\d{6,8}$/;
if (!regex.test(String(customer_mobile))) throw Error();
```

### SQL Injection Prevention
```typescript
// Using parameterized queries (safe)
await query(`SELECT * FROM deposits WHERE user_id = $1`, [userId]);

// NOT using string concatenation (dangerous)
// await query(`SELECT * FROM deposits WHERE user_id = '${userId}'`);  ❌
```

### JWT Authentication
```typescript
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;  // From verified JWT token
  // Ensures request is from authenticated user
});
```

### HTTPS (Production)
- All API calls over HTTPS
- No sensitive data in URLs
- JWT token in Authorization header (secure)

---

## 📋 Checklist: Before Merging

- [ ] TypeScript: `npm run build` = 0 errors
- [ ] Tests: All manual tests pass
- [ ] Database: Migration applied
- [ ] Frontend: 3 steps UI correct
- [ ] Backend: Validation strict
- [ ] Security: Checked
- [ ] Performance: Acceptable
- [ ] Documentation: Complete
- [ ] Code review: Approved

---

**Technical implementation complete!** 🎉
