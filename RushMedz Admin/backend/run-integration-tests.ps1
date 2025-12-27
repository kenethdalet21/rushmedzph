# Payment Gateway Integration Tests
# Tests all payment APIs for the Epharma Ecosystem

$baseUrl = "http://localhost:8085/api/payments"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   EPHARMA PAYMENT GATEWAY INTEGRATION TESTS" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Test counters
$passed = 0
$failed = 0
$total = 0

function Invoke-APITest {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Uri,
        [object]$RequestBody = $null
    )
    
    $script:total++
    Write-Host "Test $script:total : $TestName" -ForegroundColor Yellow
    
    try {
        if ($RequestBody) {
            $json = $RequestBody | ConvertTo-Json -Depth 10
            $result = Invoke-RestMethod -Uri $Uri -Method $Method -Headers $script:headers -Body $json -ErrorAction Stop
        } else {
            $result = Invoke-RestMethod -Uri $Uri -Method $Method -Headers $script:headers -ErrorAction Stop
        }
        
        Write-Host "  PASS" -ForegroundColor Green
        $script:passed++
        return $result
    }
    catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
        return $null
    }
}

Write-Host "Checking backend availability..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

# Suite 1: Transaction Creation
Write-Host "`n--- SUITE 1: CREATE TRANSACTIONS ---" -ForegroundColor Magenta

Invoke-APITest -TestName "Create COD Transaction" -Method POST -Uri "$baseUrl/transactions" -RequestBody @{


    orderId = "ORD-001"
    userId = "user-123"
    merchantId = "merchant-001"
    amount = 500.00
    currency = "PHP"
    paymentMethod = "GCASH"
    status = "PENDING"
} | Out-Null

Invoke-APITest -TestName "Create PayMaya Transaction" -Method POST -Uri "$baseUrl/transactions" -RequestBody @{
    orderId = "ORD-002"
    userId = "user-456"
    merchantId = "merchant-001"
    amount = 1200.00
    currency = "PHP"
    paymentMethod = "PAYMAYA"
    status = "PENDING"
} | Out-Null

Invoke-APITest -TestName "Create PayPal Transaction" -Method POST -Uri "$baseUrl/transactions" -RequestBody @{
    orderId = "ORD-003"
    userId = "user-789"
    merchantId = "merchant-002"
    amount = 2500.00
    currency = "PHP"
    paymentMethod = "PAYPAL"
    status = "PENDING"
} | Out-Null

Invoke-APITest -TestName "Create Card Transaction" -Method POST -Uri "$baseUrl/transactions" -RequestBody @{
    orderId = "ORD-004"
    userId = "user-111"
    merchantId = "merchant-002"
    amount = 3000.00
    currency = "PHP"
    paymentMethod = "CREDIT_CARD"
    status = "PENDING"
} | Out-Null

Invoke-APITest -TestName "Create COD Transaction" -Method POST -Uri "$baseUrl/transactions" -RequestBody @{
    orderId = "ORD-005"
    userId = "user-222"
    merchantId = "merchant-003"
    amount = 800.00
    currency = "PHP"
    paymentMethod = "COD"
    status = "COMPLETED"
} | Out-Null

# Suite 2: Payment Initiation
Write-Host "`n--- SUITE 2: INITIATE PAYMENTS ---" -ForegroundColor Magenta

$init1 = Invoke-APITest -TestName "Initiate GCash Payment" -Method POST -Uri "$baseUrl/initiate" -RequestBody @{
    orderId = "ORD-006"
    userId = "user-333"
    merchantId = "merchant-001"
    amount = 750.00
    currency = "PHP"
    paymentMethod = "GCASH"
}

$init2 = Invoke-APITest -TestName "Initiate PayMaya Payment" -Method POST -Uri "$baseUrl/initiate" -RequestBody @{
    orderId = "ORD-007"
    userId = "user-444"
    merchantId = "merchant-001"
    amount = 1500.00
    currency = "PHP"
    paymentMethod = "PAYMAYA"
}

# Suite 3: Transaction Retrieval
Write-Host "`n--- SUITE 3: GET TRANSACTIONS ---" -ForegroundColor Magenta

Invoke-APITest -TestName "Get All Transactions" -Method GET -Uri "$baseUrl/transactions"
Invoke-APITest -TestName "Filter by GCash" -Method GET -Uri "$baseUrl/transactions?paymentMethod=GCASH"
Invoke-APITest -TestName "Filter by PENDING Status" -Method GET -Uri "$baseUrl/transactions?status=PENDING"

if ($tx1) {
    Invoke-APITest -TestName "Get Transaction by ID" -Method GET -Uri "$baseUrl/transactions/$($tx1.id)"
    Invoke-APITest -TestName "Get by Order ID" -Method GET -Uri "$baseUrl/transactions/order/ORD-001"
}

# Suite 4: Payment Confirmation
Write-Host "`n--- SUITE 4: CONFIRM PAYMENTS ---" -ForegroundColor Magenta

if ($init1) {
    Invoke-APITest -TestName "Confirm GCash Payment" -Method POST -Uri "$baseUrl/confirm/$($init1.id)" -RequestBody @{
        gatewayTransactionId = "GCASH-$(Get-Random -Max 999999)"
        gatewayResponse = "Payment successful"
    }
}

# Suite 5: Payment Verification
Write-Host "`n--- SUITE 5: VERIFY PAYMENTS ---" -ForegroundColor Magenta

if ($init1) {
    Invoke-APITest -TestName "Verify Payment Status" -Method GET -Uri "$baseUrl/verify/$($init1.id)"
}

# Suite 6: Refunds
Write-Host "`n--- SUITE 6: REFUND PROCESSING ---" -ForegroundColor Magenta

if ($init2) {
    Invoke-APITest -TestName "Confirm PayMaya for Refund" -Method POST -Uri "$baseUrl/confirm/$($init2.id)" -RequestBody @{
        gatewayTransactionId = "PAYMAYA-$(Get-Random -Max 999999)"
        gatewayResponse = "Payment successful"
    }
    
    Start-Sleep -Seconds 1
    
    $refund = Invoke-APITest -TestName "Create Refund" -Method POST -Uri "$baseUrl/refunds" -RequestBody @{
        transactionId = $init2.id
        orderId = "ORD-007"
        amount = 400.00
        reason = "Customer requested refund"
    }
    
    if ($refund) {
        Invoke-APITest -TestName "Get Refund by ID" -Method GET -Uri "$baseUrl/refunds/$($refund.id)"
        Invoke-APITest -TestName "Process Refund" -Method POST -Uri "$baseUrl/refunds/process" -RequestBody @{
            refundId = $refund.id
            processedBy = "admin-001"
        }
    }
}

Invoke-APITest -TestName "Get All Refunds" -Method GET -Uri "$baseUrl/refunds"
Invoke-APITest -TestName "Refund Statistics" -Method GET -Uri "$baseUrl/refunds/statistics"

# Suite 7: Payouts
Write-Host "`n--- SUITE 7: MERCHANT PAYOUTS ---" -ForegroundColor Magenta

Invoke-APITest -TestName "Get Merchant Balance" -Method GET -Uri "$baseUrl/payouts/balance/merchant-001"

$payout = Invoke-APITest -TestName "Request Payout" -Method POST -Uri "$baseUrl/payouts/request" -RequestBody @{
    merchantId = "merchant-001"
    amount = 500.00
    payoutMethod = "GCASH"
    accountDetails = "09171234567"
}

if ($payout) {
    Invoke-APITest -TestName "Get Payout by ID" -Method GET -Uri "$baseUrl/payouts/$($payout.id)"
    Invoke-APITest -TestName "Process Payout" -Method POST -Uri "$baseUrl/payouts/$($payout.id)/process" -RequestBody @{}
}

Invoke-APITest -TestName "Get All Payouts" -Method GET -Uri "$baseUrl/payouts"
Invoke-APITest -TestName "Payout Statistics" -Method GET -Uri "$baseUrl/payouts/statistics"

# Suite 8: Analytics
Write-Host "`n--- SUITE 8: ANALYTICS ---" -ForegroundColor Magenta

Invoke-APITest -TestName "Payment Summary" -Method GET -Uri "$baseUrl/analytics/summary"
Invoke-APITest -TestName "Fraud Alerts" -Method GET -Uri "$baseUrl/analytics/fraud-alerts"

# Suite 9: Edge Cases
Write-Host "`n--- SUITE 9: EDGE CASES ---" -ForegroundColor Magenta

Invoke-APITest -TestName "Invalid Amount" -Method POST -Uri "$baseUrl/transactions" -RequestBody @{
    orderId = "ORD-BAD"
    userId = "user-999"
    merchantId = "merchant-001"
    amount = -100.00
    currency = "PHP"
    paymentMethod = "GCASH"
    status = "PENDING"
}

Invoke-APITest -TestName "Non-existent Transaction" -Method GET -Uri "$baseUrl/transactions/invalid-id"
Invoke-APITest -TestName "Confirm Invalid Payment" -Method POST -Uri "$baseUrl/confirm/invalid-id" -RequestBody @{
    gatewayTransactionId = "TEST"
    gatewayResponse = "Test"
}

# Results
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "              TEST RESULTS" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Total:   $total" -ForegroundColor White
Write-Host "Passed:  $passed" -ForegroundColor Green
Write-Host "Failed:  $failed" -ForegroundColor Red

if ($total -gt 0) {
    $rate = [math]::Round(($passed / $total) * 100, 2)
    Write-Host "Success: $rate%" -ForegroundColor Yellow
}

Write-Host "==================================================" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "`nALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "`nSome tests failed. Review errors above." -ForegroundColor Yellow
}

Write-Host "`nCompleted: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
