# 🧪 Tests Backend - Exemples cURL & PowerShell

**Date:** 28 novembre 2025  
**Endpoint:** POST `/recharge`  
**Auth:** Bearer JWT Token

---

## 📋 Prérequis

```bash
# 1. Récupérer un JWT token d'user authentifié
# Depuis le login endpoint ou admin dashboard

# 2. Remplacer {TOKEN} par votre token réel
# Remplacer {AMOUNT} par votre montant
```

---

## ✅ Cas 1: Soumission Valide

### cURL
```bash
curl -X POST http://localhost:3000/api/recharge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "amount": 5000,
    "pay_way_id": "tmoney",
    "transfer_id": "123456789",
    "customer_mobile": "95123456"
  }'
```

### PowerShell
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer {TOKEN}"
}

$body = @{
    amount = 5000
    pay_way_id = "tmoney"
    transfer_id = "123456789"
    customer_mobile = "95123456"
} | ConvertTo-Json

$response = Invoke-WebRequest `
    -Uri "http://localhost:3000/api/recharge" `
    -Method POST `
    -Headers $headers `
    -Body $body

$response.Content | ConvertFrom-Json | Format-Object
```

### Réponse Attendue ✅
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

**Vérifications DB:**
```sql
SELECT * FROM deposits WHERE id = '550e8400-e29b-41d4-a716-446655440000';
-- Doit voir: status='pending', account_number='95123456', transfer_id='123456789'

SELECT * FROM transactions WHERE reference_id = '550e8400-e29b-41d4-a716-446655440000';
-- Doit voir: status='pending'
```

---

## ❌ Cas 2: Montant Invalide (< Minimum)

### cURL
```bash
curl -X POST http://localhost:3000/api/recharge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "amount": 500,
    "pay_way_id": "tmoney",
    "transfer_id": "123456789",
    "customer_mobile": "95123456"
  }'
```

### Réponse Attendue ❌
```json
{
  "status": 0,
  "msg": "Montant minimum : 1000 XOF"
}
```

**Status HTTP:** 400

---

## ❌ Cas 3: Mobile Invalide (< 6 chiffres)

### cURL
```bash
curl -X POST http://localhost:3000/api/recharge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "amount": 5000,
    "pay_way_id": "tmoney",
    "transfer_id": "123456789",
    "customer_mobile": "95123"
  }'
```

### Réponse Attendue ❌
```json
{
  "status": 0,
  "msg": "Numéro mobile invalide (6-14 chiffres)"
}
```

---

## ❌ Cas 4: Mobile Invalide (> 8 chiffres)

### cURL
```bash
curl -X POST http://localhost:3000/api/recharge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "amount": 5000,
    "pay_way_id": "tmoney",
    "transfer_id": "123456789",
    "customer_mobile": "951234567"
  }'
```

### Réponse Attendue ❌
```json
{
  "status": 0,
  "msg": "Numéro mobile invalide (6-14 chiffres)"
}
```

---

## ❌ Cas 5: Transfer ID Invalide (< 9 chiffres)

### cURL
```bash
curl -X POST http://localhost:3000/api/recharge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "amount": 5000,
    "pay_way_id": "tmoney",
    "transfer_id": "12345678",
    "customer_mobile": "95123456"
  }'
```

### Réponse Attendue ❌
```json
{
  "status": 0,
  "msg": "ID de transfert invalide (9-11 chiffres)"
}
```

---

## ❌ Cas 6: Transfer ID Invalide (> 11 chiffres)

### cURL
```bash
curl -X POST http://localhost:3000/api/recharge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "amount": 5000,
    "pay_way_id": "tmoney",
    "transfer_id": "123456789012",
    "customer_mobile": "95123456"
  }'
```

### Réponse Attendue ❌
```json
{
  "status": 0,
  "msg": "ID de transfert invalide (9-11 chiffres)"
}
```

---

## ❌ Cas 7: Montant Zéro

### cURL
```bash
curl -X POST http://localhost:3000/api/recharge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "amount": 0,
    "pay_way_id": "tmoney",
    "transfer_id": "123456789",
    "customer_mobile": "95123456"
  }'
```

### Réponse Attendue ❌
```json
{
  "status": 0,
  "msg": "Invalid amount"
}
```

---

## ❌ Cas 8: Mobile Vide

### cURL
```bash
curl -X POST http://localhost:3000/api/recharge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "amount": 5000,
    "pay_way_id": "tmoney",
    "transfer_id": "123456789",
    "customer_mobile": ""
  }'
```

### Réponse Attendue ❌
```json
{
  "status": 0,
  "msg": "Numéro mobile invalide (6-14 chiffres)"
}
```

---

## ❌ Cas 9: Transfer ID Vide

### cURL
```bash
curl -X POST http://localhost:3000/api/recharge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "amount": 5000,
    "pay_way_id": "tmoney",
    "transfer_id": "",
    "customer_mobile": "95123456"
  }'
```

### Réponse Attendue ❌
```json
{
  "status": 0,
  "msg": "ID de transfert invalide (9-11 chiffres)"
}
```

---

## 📊 Cas 10: Validation Montant Méthode Spécifique

### Scenario
- Payment Method: "Premium Bank" avec `min_deposit = 10000`
- Request amount: 5000 (valide pour plateforme, mais pas pour méthode)

### cURL
```bash
curl -X POST http://localhost:3000/api/recharge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "amount": 5000,
    "pay_way_id": "bank-premium",
    "transfer_id": "123456789",
    "customer_mobile": "95123456"
  }'
```

### Réponse Attendue ❌
```json
{
  "status": 0,
  "msg": "Montant minimum pour cette méthode : 10000 XOF"
}
```

---

## 🎯 Séquence de Test Complète

### Script PowerShell Complet
```powershell
# Config
$baseUrl = "http://localhost:3000/api"
$token = "{YOUR_TOKEN_HERE}"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

function TestRecharge {
    param(
        [string]$testName,
        [int]$amount,
        [string]$payWayId,
        [string]$transferId,
        [string]$mobile,
        [bool]$shouldFail
    )
    
    Write-Host "`n--- $testName ---"
    
    $body = @{
        amount = $amount
        pay_way_id = $payWayId
        transfer_id = $transferId
        customer_mobile = $mobile
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest `
            -Uri "$baseUrl/recharge" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        $result = $response.Content | ConvertFrom-Json
        Write-Host "✅ SUCCESS: $($result.msg)" -ForegroundColor Green
        Write-Host "Response: $($result | ConvertTo-Json)"
        
    } catch {
        $result = $_.Exception.Response.Content | ConvertFrom-Json
        if ($shouldFail) {
            Write-Host "❌ EXPECTED FAILURE: $($result.msg)" -ForegroundColor Yellow
        } else {
            Write-Host "❌ UNEXPECTED FAILURE: $($result.msg)" -ForegroundColor Red
        }
        Write-Host "Response: $($result | ConvertTo-Json)"
    }
}

# Cas 1: Valide
TestRecharge "Cas 1: Valide" 5000 "tmoney" "123456789" "95123456" $false

# Cas 2: Montant trop bas
TestRecharge "Cas 2: Montant 500 < minimum 1000" 500 "tmoney" "123456789" "95123456" $true

# Cas 3: Mobile 5 chiffres
TestRecharge "Cas 3: Mobile 5 chiffres" 5000 "tmoney" "123456789" "95123" $true

# Cas 4: Mobile 9 chiffres
TestRecharge "Cas 4: Mobile 9 chiffres" 5000 "tmoney" "123456789" "951234567" $true

# Cas 5: Transfer ID 8 chiffres
TestRecharge "Cas 5: Transfer ID 8 chiffres" 5000 "tmoney" "12345678" "95123456" $true

# Cas 6: Transfer ID 12 chiffres
TestRecharge "Cas 6: Transfer ID 12 chiffres" 5000 "tmoney" "123456789012" "95123456" $true

# Cas 7: Montant 0
TestRecharge "Cas 7: Montant 0" 0 "tmoney" "123456789" "95123456" $true

Write-Host "`n=== Tests terminés ===" -ForegroundColor Cyan
```

### Exécuter
```powershell
# Sauvegarder en test_recharge.ps1
./test_recharge.ps1
```

---

## 🔐 Pas de Token?

### Obtenir un Token (via Login)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Extrait Token de la Réponse
```json
{
  "status": 1,
  "msg": "Login successful",
  "result": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### Utilise le Token
```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
$headers = @{
    "Authorization" = "Bearer $token"
}
```

---

## 📋 Checklist Test

- [ ] Cas 1 (Valide) ✅
- [ ] Cas 2 (Montant < min) ❌
- [ ] Cas 3 (Mobile < 6) ❌
- [ ] Cas 4 (Mobile > 8) ❌
- [ ] Cas 5 (Transfer < 9) ❌
- [ ] Cas 6 (Transfer > 11) ❌
- [ ] Cas 7 (Montant 0) ❌
- [ ] Cas 8 (Mobile vide) ❌
- [ ] Cas 9 (Transfer vide) ❌
- [ ] Cas 10 (Montant méthode) ❌
- [ ] DB: deposits créé avec status='pending'
- [ ] DB: transfer_id stocké correctement
- [ ] DB: account_number = mobile user

---

**Status:** Prêt à tester ! 🚀
