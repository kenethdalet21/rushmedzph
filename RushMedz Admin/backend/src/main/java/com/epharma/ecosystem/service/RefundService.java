package com.epharma.ecosystem.service;

import com.epharma.ecosystem.model.Refund;
import com.epharma.ecosystem.model.PaymentTransaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class RefundService {
    
    @Autowired
    private PaymentService paymentService;
    
    // In-memory storage (replace with database in production)
    private final Map<String, Refund> refunds = new ConcurrentHashMap<>();

    public List<Refund> getAllRefunds(String transactionId, String orderId, String status) {
        return refunds.values().stream()
            .filter(r -> transactionId == null || transactionId.equals(r.getTransactionId()))
            .filter(r -> orderId == null || orderId.equals(r.getOrderId()))
            .filter(r -> status == null || status.equals(r.getStatus()))
            .sorted(Comparator.comparing(Refund::getCreatedAt).reversed())
            .collect(Collectors.toList());
    }

    public Refund getRefundById(String id) {
        return refunds.get(id);
    }

    public Refund createRefund(Refund refund) {
        if (refund.getId() == null) {
            refund.setId(UUID.randomUUID().toString());
        }
        
        // Validate that the transaction exists
        PaymentTransaction transaction = paymentService.getTransactionById(refund.getTransactionId());
        if (transaction == null) {
            throw new IllegalArgumentException("Transaction not found: " + refund.getTransactionId());
        }
        
        // Validate refund amount
        double availableForRefund = transaction.getAmount() - transaction.getRefundedAmount();
        if (refund.getAmount() > availableForRefund) {
            throw new IllegalArgumentException("Refund amount exceeds available amount");
        }
        
        refund.setStatus("pending");
        refunds.put(refund.getId(), refund);
        
        return refund;
    }

    public Refund updateRefundStatus(String id, String status) {
        Refund refund = refunds.get(id);
        if (refund != null) {
            String oldStatus = refund.getStatus();
            refund.setStatus(status);
            
            // If refund is completed, update the transaction
            if ("completed".equals(status) && !"completed".equals(oldStatus)) {
                PaymentTransaction transaction = paymentService.getTransactionById(refund.getTransactionId());
                if (transaction != null) {
                    double newRefundedAmount = transaction.getRefundedAmount() + refund.getAmount();
                    transaction.setRefundedAmount(newRefundedAmount);
                    
                    // Generate gateway refund ID
                    refund.setGatewayRefundId("RFD-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
                }
            }
        }
        return refund;
    }

    public Refund processRefund(String transactionId, String orderId, Double amount, 
                               String reason, String processedBy) {
        Refund refund = new Refund();
        refund.setId(UUID.randomUUID().toString());
        refund.setTransactionId(transactionId);
        refund.setOrderId(orderId);
        refund.setAmount(amount);
        refund.setReason(reason);
        refund.setProcessedBy(processedBy);
        refund.setStatus("pending");
        
        refunds.put(refund.getId(), refund);
        
        // Auto-process small refunds (< 500 PHP)
        if (amount < 500) {
            updateRefundStatus(refund.getId(), "completed");
        }
        
        return refund;
    }

    public Map<String, Object> getRefundStatistics(String merchantId) {
        List<Refund> merchantRefunds = refunds.values().stream()
            .filter(r -> {
                PaymentTransaction tx = paymentService.getTransactionById(r.getTransactionId());
                return tx != null && (merchantId == null || merchantId.equals(tx.getMerchantId()));
            })
            .collect(Collectors.toList());
        
        long totalRefunds = merchantRefunds.size();
        double totalAmount = merchantRefunds.stream()
            .filter(r -> "completed".equals(r.getStatus()))
            .mapToDouble(Refund::getAmount)
            .sum();
        
        long pendingRefunds = merchantRefunds.stream()
            .filter(r -> "pending".equals(r.getStatus()))
            .count();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRefunds", totalRefunds);
        stats.put("totalAmount", totalAmount);
        stats.put("pendingRefunds", pendingRefunds);
        
        return stats;
    }
}
