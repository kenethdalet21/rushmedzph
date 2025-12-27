package com.epharma.ecosystem.service;

import com.epharma.ecosystem.model.PaymentTransaction;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class PaymentService {
    
    // In-memory storage (replace with database in production)
    private final Map<String, PaymentTransaction> transactions = new ConcurrentHashMap<>();

    public List<PaymentTransaction> getAllTransactions(String userId, String merchantId, 
                                                      String orderId, String status, 
                                                      String paymentMethod, String fromDate, 
                                                      String toDate) {
        return transactions.values().stream()
            .filter(tx -> userId == null || userId.equals(tx.getUserId()))
            .filter(tx -> merchantId == null || merchantId.equals(tx.getMerchantId()))
            .filter(tx -> orderId == null || orderId.equals(tx.getOrderId()))
            .filter(tx -> status == null || status.equals(tx.getStatus()))
            .filter(tx -> paymentMethod == null || paymentMethod.equals(tx.getPaymentMethod()))
            .filter(tx -> fromDate == null || tx.getCreatedAt().isAfter(LocalDateTime.parse(fromDate)))
            .filter(tx -> toDate == null || tx.getCreatedAt().isBefore(LocalDateTime.parse(toDate)))
            .sorted(Comparator.comparing(PaymentTransaction::getCreatedAt).reversed())
            .collect(Collectors.toList());
    }

    public PaymentTransaction getTransactionById(String id) {
        return transactions.get(id);
    }

    public List<PaymentTransaction> getTransactionsByOrder(String orderId) {
        return transactions.values().stream()
            .filter(tx -> orderId.equals(tx.getOrderId()))
            .collect(Collectors.toList());
    }

    public PaymentTransaction createTransaction(PaymentTransaction transaction) {
        if (transaction.getId() == null) {
            transaction.setId(UUID.randomUUID().toString());
        }
        transaction.calculateProcessingFee();
        transactions.put(transaction.getId(), transaction);
        return transaction;
    }

    public PaymentTransaction updateTransactionStatus(String id, String status, String metadata) {
        PaymentTransaction transaction = transactions.get(id);
        if (transaction != null) {
            transaction.setStatus(status);
            if (metadata != null) {
                transaction.setMetadata(metadata);
            }
            transaction.setUpdatedAt(LocalDateTime.now());
        }
        return transaction;
    }

    public Map<String, Object> initiatePayment(String orderId, String userId, String merchantId,
                                               Double amount, String currency, String paymentMethod,
                                               String returnUrl, String metadata) {
        // Create transaction
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setId(UUID.randomUUID().toString());
        transaction.setOrderId(orderId);
        transaction.setUserId(userId);
        transaction.setMerchantId(merchantId);
        transaction.setAmount(amount);
        transaction.setCurrency(currency);
        transaction.setPaymentMethod(paymentMethod);
        transaction.setStatus("pending");
        transaction.setMetadata(metadata);
        transaction.calculateProcessingFee();
        
        transactions.put(transaction.getId(), transaction);

        // Generate payment response based on method
        Map<String, Object> response = new HashMap<>();
        response.put("transactionId", transaction.getId());

        switch (paymentMethod.toLowerCase()) {
            case "gcash":
            case "paymaya":
                response.put("paymentUrl", generatePaymentUrl(paymentMethod, transaction.getId(), amount));
                response.put("reference", "REF-" + transaction.getId().substring(0, 8).toUpperCase());
                response.put("expiresAt", LocalDateTime.now().plusHours(1).toString());
                break;
            case "paypal":
                response.put("paymentUrl", "https://www.paypal.com/checkoutnow?token=" + transaction.getId());
                break;
            case "razorpay":
                response.put("paymentUrl", "https://checkout.razorpay.com/" + transaction.getId());
                break;
            case "card":
                response.put("paymentUrl", generatePaymentUrl("card", transaction.getId(), amount));
                break;
            case "cod":
                // COD doesn't need payment URL, mark as processing
                transaction.setStatus("processing");
                response.put("message", "Cash on Delivery - Payment will be collected upon delivery");
                break;
        }

        return response;
    }

    public PaymentTransaction confirmPayment(String transactionId, Map<String, Object> confirmationData) {
        PaymentTransaction transaction = transactions.get(transactionId);
        if (transaction != null) {
            transaction.setStatus("completed");
            transaction.setGatewayTransactionId("GTW-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
            
            if (confirmationData != null) {
                transaction.setGatewayResponse(confirmationData.toString());
            }
            
            transaction.setUpdatedAt(LocalDateTime.now());
        }
        return transaction;
    }

    public PaymentTransaction cancelPayment(String transactionId, String reason) {
        PaymentTransaction transaction = transactions.get(transactionId);
        if (transaction != null) {
            transaction.setStatus("cancelled");
            transaction.setMetadata(transaction.getMetadata() + "; Cancellation reason: " + reason);
            transaction.setUpdatedAt(LocalDateTime.now());
        }
        return transaction;
    }

    public Map<String, Object> verifyPayment(String transactionId) {
        PaymentTransaction transaction = transactions.get(transactionId);
        Map<String, Object> result = new HashMap<>();
        
        if (transaction != null) {
            result.put("verified", "completed".equals(transaction.getStatus()));
            result.put("status", transaction.getStatus());
            result.put("gatewayResponse", transaction.getGatewayResponse());
        } else {
            result.put("verified", false);
            result.put("status", "not_found");
        }
        
        return result;
    }

    public Map<String, Object> getAnalyticsSummary(String merchantId, String userId, 
                                                   String fromDate, String toDate) {
        List<PaymentTransaction> filtered = getAllTransactions(userId, merchantId, null, null, 
                                                               null, fromDate, toDate);
        
        long totalTransactions = filtered.size();
        double totalAmount = filtered.stream()
            .mapToDouble(PaymentTransaction::getAmount)
            .sum();
        
        long successfulPayments = filtered.stream()
            .filter(tx -> "completed".equals(tx.getStatus()))
            .count();
        
        long failedPayments = filtered.stream()
            .filter(tx -> "failed".equals(tx.getStatus()))
            .count();
        
        double refundedAmount = filtered.stream()
            .mapToDouble(PaymentTransaction::getRefundedAmount)
            .sum();
        
        double avgTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
        
        // Payment method breakdown
        Map<String, Long> methodBreakdown = filtered.stream()
            .collect(Collectors.groupingBy(PaymentTransaction::getPaymentMethod, Collectors.counting()));
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalTransactions", totalTransactions);
        summary.put("totalAmount", totalAmount);
        summary.put("successfulPayments", successfulPayments);
        summary.put("failedPayments", failedPayments);
        summary.put("refundedAmount", refundedAmount);
        summary.put("averageTransactionValue", avgTransaction);
        summary.put("paymentMethodBreakdown", methodBreakdown);
        
        return summary;
    }

    public List<Map<String, Object>> getFraudAlerts() {
        // Simple fraud detection logic
        List<Map<String, Object>> alerts = new ArrayList<>();
        
        // Check for multiple failed transactions from same user
        Map<String, Long> failedByUser = transactions.values().stream()
            .filter(tx -> "failed".equals(tx.getStatus()))
            .collect(Collectors.groupingBy(PaymentTransaction::getUserId, Collectors.counting()));
        
        failedByUser.forEach((userId, count) -> {
            if (count > 3) {
                Map<String, Object> alert = new HashMap<>();
                alert.put("type", "multiple_failed_attempts");
                alert.put("userId", userId);
                alert.put("count", count);
                alert.put("severity", "high");
                alert.put("timestamp", LocalDateTime.now().toString());
                alerts.add(alert);
            }
        });
        
        return alerts;
    }

    private String generatePaymentUrl(String method, String transactionId, Double amount) {
        return "https://payment-gateway.epharma.com/%s/checkout?tx=%s&amount=%.2f".formatted(
            method.toLowerCase(), transactionId, amount);
    }

    public void handleGatewayWebhook(String provider, Map<String, Object> payload) {
        // Attempt to extract a transaction identifier
        String txId = Optional.ofNullable((String) payload.get("transactionId"))
                .orElseGet(() -> Optional.ofNullable((String) payload.get("id")).orElse(null));

        if (txId == null) {
            // Some gateways provide order/ reference, ignore if not mapped
            return;
        }

        PaymentTransaction tx = transactions.get(txId);
        if (tx == null) {
            return; // Unknown transaction
        }

        String status = Optional.ofNullable((String) payload.get("status")).orElse("completed");
        // Normalize simple statuses
        switch (status.toLowerCase()) {
            case "paid":
            case "success":
            case "succeeded":
            case "captured":
            case "completed":
                tx.setStatus("completed");
                break;
            case "failed":
            case "cancelled":
            case "voided":
                tx.setStatus("failed");
                break;
            default:
                tx.setStatus("processing");
        }
        tx.setGatewayResponse(payload.toString());
        tx.setUpdatedAt(LocalDateTime.now());
    }
}
