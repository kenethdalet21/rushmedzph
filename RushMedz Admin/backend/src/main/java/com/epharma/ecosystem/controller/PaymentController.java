package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.model.PaymentTransaction;
import com.epharma.ecosystem.service.PaymentService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${webhook.gcash.secret:}")
    private String gcashSecret;

    @Value("${webhook.paymaya.secret:}")
    private String paymayaSecret;

    @Value("${webhook.paypal.secret:}")
    private String paypalSecret;

    @Value("${webhook.razorpay.secret:}")
    private String razorpaySecret;

    @GetMapping("/transactions")
    public ResponseEntity<List<PaymentTransaction>> getAllTransactions(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String merchantId,
            @RequestParam(required = false) String orderId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        
        List<PaymentTransaction> transactions = paymentService.getAllTransactions(
            userId, merchantId, orderId, status, paymentMethod, fromDate, toDate
        );
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/transactions/{id}")
    public ResponseEntity<PaymentTransaction> getTransactionById(@PathVariable String id) {
        PaymentTransaction transaction = paymentService.getTransactionById(id);
        if (transaction != null) {
            return ResponseEntity.ok(transaction);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/transactions/order/{orderId}")
    public ResponseEntity<List<PaymentTransaction>> getTransactionsByOrder(@PathVariable String orderId) {
        List<PaymentTransaction> transactions = paymentService.getTransactionsByOrder(orderId);
        return ResponseEntity.ok(transactions);
    }

    @PostMapping("/transactions")
    public ResponseEntity<?> createTransaction(@RequestBody PaymentTransaction transaction) {
        try {
            // Validate amount
            if (transaction.getAmount() == null || transaction.getAmount() <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid amount",
                    "message", "Amount must be greater than 0"
                ));
            }
            // Validate currency
            if (transaction.getCurrency() == null || !"PHP".equalsIgnoreCase(transaction.getCurrency())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Unsupported currency",
                    "message", "Only PHP currency is supported"
                ));
            }
            
            // Validate required fields
            if (transaction.getOrderId() == null || transaction.getOrderId().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Missing required field: orderId"
                ));
            }
            
            if (transaction.getPaymentMethod() == null || transaction.getPaymentMethod().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Missing required field: paymentMethod"
                ));
            }
            // Validate payment method
            String method = transaction.getPaymentMethod().toLowerCase();
            if (!(method.equals("gcash") || method.equals("paymaya") || method.equals("paypal") || method.equals("razorpay") || method.equals("card") || method.equals("cod") || method.equals("wallet"))) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Unsupported payment method",
                    "message", transaction.getPaymentMethod()
                ));
            }
            
            PaymentTransaction created = paymentService.createTransaction(transaction);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to create transaction",
                "message", e.getMessage()
            ));
        }
    }

    @PatchMapping("/transactions/{id}/status")
    public ResponseEntity<PaymentTransaction> updateTransactionStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        
        String status = body.get("status");
        String metadata = body.get("metadata");
        
        PaymentTransaction updated = paymentService.updateTransactionStatus(id, status, metadata);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/initiate")
    public ResponseEntity<Map<String, Object>> initiatePayment(@RequestBody Map<String, Object> request) {
        try {
            String orderId = (String) request.get("orderId");
            String userId = (String) request.get("userId");
            String merchantId = (String) request.get("merchantId");
            Double amount = ((Number) request.get("amount")).doubleValue();
            String currency = (String) request.get("currency");
            String paymentMethod = (String) request.get("paymentMethod");
            String returnUrl = (String) request.get("returnUrl");
            String metadata = request.get("metadata") != null ? request.get("metadata").toString() : null;
            
            Map<String, Object> response = paymentService.initiatePayment(
                orderId, userId, merchantId, amount, currency, paymentMethod, returnUrl, metadata
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/confirm/{transactionId}")
    public ResponseEntity<?> confirmPayment(
            @PathVariable String transactionId,
            @RequestBody(required = false) Map<String, Object> confirmationData) {
        
        System.out.println("[Payment Confirmation] Attempting to confirm transaction: " + transactionId);
        
        PaymentTransaction confirmed = paymentService.confirmPayment(transactionId, confirmationData);
        if (confirmed != null) {
            System.out.println("[Payment Confirmation] Success: " + transactionId + " -> " + confirmed.getStatus());
            return ResponseEntity.ok(confirmed);
        }
        
        System.out.println("[Payment Confirmation] Failed: Transaction not found - " + transactionId);
        return ResponseEntity.status(404).body(Map.of(
            "error", "Transaction not found",
            "transactionId", transactionId
        ));
    }

    @PostMapping("/cancel/{transactionId}")
    public ResponseEntity<PaymentTransaction> cancelPayment(
            @PathVariable String transactionId,
            @RequestBody(required = false) Map<String, String> body) {
        
        String reason = body != null ? body.get("reason") : "User cancelled";
        PaymentTransaction cancelled = paymentService.cancelPayment(transactionId, reason);
        
        if (cancelled != null) {
            return ResponseEntity.ok(cancelled);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/verify/{transactionId}")
    public ResponseEntity<Map<String, Object>> verifyPayment(@PathVariable String transactionId) {
        Map<String, Object> result = paymentService.verifyPayment(transactionId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/analytics/summary")
    public ResponseEntity<Map<String, Object>> getAnalyticsSummary(
            @RequestParam(required = false) String merchantId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        
        Map<String, Object> summary = paymentService.getAnalyticsSummary(
            merchantId, userId, fromDate, toDate
        );
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/analytics/fraud-alerts")
    public ResponseEntity<List<Map<String, Object>>> getFraudAlerts() {
        List<Map<String, Object>> alerts = paymentService.getFraudAlerts();
        return ResponseEntity.ok(alerts);
    }

    // Webhook endpoints (simplified - in production, verify signatures)
    @PostMapping("/webhooks/gcash")
    public ResponseEntity<?> handleGCashWebhook(HttpServletRequest req, @RequestBody String rawPayload) {
        String sig = req.getHeader("X-Signature");
        if (sig == null || sig.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("error", "Missing signature"));
        }
        if (gcashSecret == null || gcashSecret.isEmpty()) {
            return ResponseEntity.status(500).body(Map.of("error", "GCash webhook secret not configured"));
        }
        if (!verifyHmacSha256(rawPayload, gcashSecret, sig)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid signature"));
        }
        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(rawPayload, new TypeReference<Map<String, Object>>(){});
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", "Invalid payload"));
        }
        paymentService.handleGatewayWebhook("gcash", payload);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping("/webhooks/paymaya")
    public ResponseEntity<?> handlePayMayaWebhook(HttpServletRequest req, @RequestBody String rawPayload) {
        String sig = req.getHeader("PayMaya-Signature");
        if (sig == null || sig.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("error", "Missing signature"));
        }
        if (paymayaSecret == null || paymayaSecret.isEmpty()) {
            return ResponseEntity.status(500).body(Map.of("error", "PayMaya webhook secret not configured"));
        }
        if (!verifyHmacSha256(rawPayload, paymayaSecret, sig)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid signature"));
        }
        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(rawPayload, new TypeReference<Map<String, Object>>(){});
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", "Invalid payload"));
        }
        paymentService.handleGatewayWebhook("paymaya", payload);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping("/webhooks/paypal")
    public ResponseEntity<?> handlePayPalWebhook(HttpServletRequest req, @RequestBody String rawPayload) {
        String sig = req.getHeader("Paypal-Transmission-Sig");
        if (sig == null || sig.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("error", "Missing signature"));
        }
        if (paypalSecret == null || paypalSecret.isEmpty()) {
            return ResponseEntity.status(500).body(Map.of("error", "PayPal webhook secret not configured"));
        }
        if (!verifyHmacSha256(rawPayload, paypalSecret, sig)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid signature"));
        }
        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(rawPayload, new TypeReference<Map<String, Object>>(){});
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", "Invalid payload"));
        }
        paymentService.handleGatewayWebhook("paypal", payload);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping("/webhooks/razorpay")
    public ResponseEntity<?> handleRazorpayWebhook(HttpServletRequest req, @RequestBody String rawPayload) {
        String sig = req.getHeader("X-Razorpay-Signature");
        if (sig == null || sig.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("error", "Missing signature"));
        }
        if (razorpaySecret == null || razorpaySecret.isEmpty()) {
            return ResponseEntity.status(500).body(Map.of("error", "Razorpay webhook secret not configured"));
        }
        if (!verifyHmacSha256(rawPayload, razorpaySecret, sig)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid signature"));
        }
        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(rawPayload, new TypeReference<Map<String, Object>>(){});
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", "Invalid payload"));
        }
        paymentService.handleGatewayWebhook("razorpay", payload);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    private boolean verifyHmacSha256(String payload, String secret, String signatureHex) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hmac = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hmac) {
                sb.append("%02x".formatted(b));
            }
            String computed = sb.toString();
            return computed.equalsIgnoreCase(signatureHex);
        } catch (Exception e) {
            return false;
        }
    }
}
