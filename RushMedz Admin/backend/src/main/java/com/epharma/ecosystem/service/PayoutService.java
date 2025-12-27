package com.epharma.ecosystem.service;

import com.epharma.ecosystem.model.Payout;
import com.epharma.ecosystem.model.PaymentTransaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class PayoutService {
    
    @Autowired
    private PaymentService paymentService;
    
    // In-memory storage (replace with database in production)
    private final Map<String, Payout> payouts = new ConcurrentHashMap<>();

    public List<Payout> getAllPayouts(String merchantId) {
        return payouts.values().stream()
            .filter(p -> merchantId == null || merchantId.equals(p.getMerchantId()))
            .sorted(Comparator.comparing(Payout::getCreatedAt).reversed())
            .collect(Collectors.toList());
    }

    public Payout getPayoutById(String id) {
        return payouts.get(id);
    }

    public Payout createPayout(Payout payout) {
        if (payout.getId() == null) {
            payout.setId(UUID.randomUUID().toString());
        }
        payout.setStatus("pending");
        payouts.put(payout.getId(), payout);
        return payout;
    }

    public Payout updatePayoutStatus(String id, String status) {
        Payout payout = payouts.get(id);
        if (payout != null) {
            payout.setStatus(status);
            if ("completed".equals(status)) {
                payout.setCompletedDate(LocalDateTime.now());
            }
        }
        return payout;
    }

    public Map<String, Object> getMerchantBalance(String merchantId) {
        // Get all completed transactions for merchant
        List<PaymentTransaction> completedTx = paymentService.getAllTransactions(
            null, merchantId, null, "completed", null, null, null
        );
        
        // Calculate total earnings (net amount after fees)
        double totalEarnings = completedTx.stream()
            .mapToDouble(PaymentTransaction::getNetAmount)
            .sum();
        
        // Calculate already paid out amount
        double paidOut = payouts.values().stream()
            .filter(p -> merchantId.equals(p.getMerchantId()))
            .filter(p -> "completed".equals(p.getStatus()))
            .mapToDouble(Payout::getAmount)
            .sum();
        
        // Calculate pending payouts
        double pendingPayouts = payouts.values().stream()
            .filter(p -> merchantId.equals(p.getMerchantId()))
            .filter(p -> List.of("pending", "processing").contains(p.getStatus()))
            .mapToDouble(Payout::getAmount)
            .sum();
        
        // Get transactions from last 7 days (pending settlement period)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        double pendingBalance = completedTx.stream()
            .filter(tx -> tx.getCreatedAt().isAfter(sevenDaysAgo))
            .mapToDouble(PaymentTransaction::getNetAmount)
            .sum();
        
        double availableBalance = totalEarnings - paidOut - pendingPayouts - pendingBalance;
        
        Map<String, Object> balance = new HashMap<>();
        balance.put("availableBalance", Math.max(0, availableBalance));
        balance.put("pendingBalance", pendingBalance + pendingPayouts);
        balance.put("totalEarnings", totalEarnings);
        balance.put("currency", "PHP");
        
        return balance;
    }

    public Payout requestPayout(String merchantId, Double amount, String payoutMethod, 
                               Map<String, String> accountDetails) {
        // Verify merchant has sufficient balance
        Map<String, Object> balance = getMerchantBalance(merchantId);
        Double availableBalance = (Double) balance.get("availableBalance");
        
        if (availableBalance < amount) {
            throw new IllegalArgumentException("Insufficient balance for payout");
        }
        
        // Get eligible transactions for this payout
        List<PaymentTransaction> eligibleTx = paymentService.getAllTransactions(
            null, merchantId, null, "completed", null, null, null
        ).stream()
            .filter(tx -> tx.getCreatedAt().isBefore(LocalDateTime.now().minusDays(7)))
            .limit(100)
            .collect(Collectors.toList());
        
        Payout payout = new Payout();
        payout.setId(UUID.randomUUID().toString());
        payout.setMerchantId(merchantId);
        payout.setAmount(amount);
        payout.setPayoutMethod(payoutMethod);
        payout.setAccountDetails(accountDetails.toString());
        payout.setStatus("pending");
        payout.setScheduledDate(LocalDateTime.now().plusDays(1)); // Schedule for next day
        
        List<String> txIds = eligibleTx.stream()
            .map(PaymentTransaction::getId)
            .collect(Collectors.toList());
        payout.setTransactionIds(txIds);
        
        payouts.put(payout.getId(), payout);
        
        return payout;
    }

    public Payout processPayout(String payoutId) {
        Payout payout = payouts.get(payoutId);
        if (payout == null) {
            throw new IllegalArgumentException("Payout not found");
        }
        
        // Simulate payout processing
        payout.setStatus("processing");
        
        // Auto-complete after a short delay (in production, this would be async)
        payout.setStatus("completed");
        payout.setCompletedDate(LocalDateTime.now());
        
        return payout;
    }

    public Map<String, Object> getPayoutStatistics() {
        long totalPayouts = payouts.size();
        
        double totalAmount = payouts.values().stream()
            .filter(p -> "completed".equals(p.getStatus()))
            .mapToDouble(Payout::getAmount)
            .sum();
        
        long pendingPayouts = payouts.values().stream()
            .filter(p -> "pending".equals(p.getStatus()))
            .count();
        
        double pendingAmount = payouts.values().stream()
            .filter(p -> "pending".equals(p.getStatus()))
            .mapToDouble(Payout::getAmount)
            .sum();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPayouts", totalPayouts);
        stats.put("totalAmount", totalAmount);
        stats.put("pendingPayouts", pendingPayouts);
        stats.put("pendingAmount", pendingAmount);
        
        return stats;
    }
}
