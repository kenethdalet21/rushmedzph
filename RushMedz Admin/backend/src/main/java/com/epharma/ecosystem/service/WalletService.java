package com.epharma.ecosystem.service;

import com.epharma.ecosystem.model.WalletBalance;
import com.epharma.ecosystem.model.WalletTopUp;
import com.epharma.ecosystem.repository.WalletBalanceRepository;
import com.epharma.ecosystem.repository.WalletTopUpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class WalletService {

    @Autowired
    private WalletBalanceRepository balanceRepo;

    @Autowired
    private WalletTopUpRepository topUpRepo;

    public WalletBalance getBalance(String userId) {
        if (userId == null || userId.isEmpty()) throw new IllegalArgumentException("userId is required");
        Double bal = balanceRepo.findById(userId).map(WalletBalance::getBalance).orElse(0.0);
        return new WalletBalance(userId, bal);
    }

    public List<WalletTopUp> listTopUps(String userId) {
        if (userId == null || userId.isEmpty()) throw new IllegalArgumentException("userId is required");
        return topUpRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<WalletTopUp> adminListTopUps() {
        return topUpRepo.findAll().stream()
                .sorted(Comparator.comparing(WalletTopUp::getCreatedAt).reversed())
                .toList();
    }

    public WalletTopUp topUp(String userId, Double amount, String method) {
        if (userId == null || userId.isEmpty()) throw new IllegalArgumentException("userId is required");
        if (amount == null || amount <= 0) throw new IllegalArgumentException("Amount must be > 0");
        if (method == null || method.isEmpty()) throw new IllegalArgumentException("Payment method required");

        WalletTopUp tu = new WalletTopUp();
        tu.setId("wlt_" + UUID.randomUUID().toString().substring(0, 8));
        tu.setUserId(userId);
        tu.setAmount(amount);
        tu.setPaymentMethod(method);
        tu.setReference("REF-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        tu.setStatus("processing");
        tu.setType("topup");
        tu.setCreatedAt(LocalDateTime.now());
        tu.setUpdatedAt(LocalDateTime.now());
        topUpRepo.save(tu);

        // Simulate processing success
        tu.setStatus("completed");
        topUpRepo.save(tu);
        updateBalance(userId, amount);
        return tu;
    }

    public WalletBalance deduct(String userId, Double amount) {
        if (userId == null || userId.isEmpty()) throw new IllegalArgumentException("userId is required");
        Double current = balanceRepo.findById(userId).map(WalletBalance::getBalance).orElse(0.0);
        if (amount == null || amount <= 0) throw new IllegalArgumentException("Amount must be > 0");
        if (current < amount) throw new IllegalStateException("Insufficient wallet balance");
        WalletBalance b = new WalletBalance(userId, current - amount);
        balanceRepo.save(b);
        return b;
    }

    public WalletTopUp adminRefundTopUp(String topUpId, String adminNote) {
        if (topUpId == null || topUpId.isEmpty()) throw new IllegalArgumentException("topUpId is required");
        WalletTopUp original = topUpRepo.findById(topUpId).orElseThrow(() -> new NoSuchElementException("Top up not found"));
        if (!"completed".equals(original.getStatus()) || !"topup".equals(original.getType())) {
            throw new IllegalStateException("Only completed top-ups can be refunded");
        }
        String origUserId = original.getUserId();
        if (origUserId == null || origUserId.isEmpty()) throw new IllegalStateException("Original userId missing");
        Double current = balanceRepo.findById(origUserId).map(WalletBalance::getBalance).orElse(0.0);
        if (current < original.getAmount()) throw new IllegalStateException("Insufficient balance to refund");

        original.setStatus("refunded");
        original.setUpdatedAt(LocalDateTime.now());
        topUpRepo.save(original);

        WalletTopUp refund = new WalletTopUp();
        refund.setId("wlt_" + UUID.randomUUID().toString().substring(0, 8));
        refund.setUserId(original.getUserId());
        refund.setAmount(-original.getAmount());
        refund.setPaymentMethod(original.getPaymentMethod());
        refund.setType("refund");
        refund.setStatus("completed");
        refund.setReference("RFD-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        refund.setAdminNote(adminNote);
        refund.setCreatedAt(LocalDateTime.now());
        refund.setUpdatedAt(LocalDateTime.now());
        topUpRepo.save(refund);

        updateBalance(original.getUserId(), -original.getAmount());
        return refund;
    }

    public WalletTopUp adminAdjust(String userId, Double delta, String adminNote) {
        if (userId == null || userId.isEmpty()) throw new IllegalArgumentException("userId is required");
        if (delta == null || delta == 0.0) throw new IllegalArgumentException("Delta must be non-zero");
        Double current = balanceRepo.findById(userId).map(WalletBalance::getBalance).orElse(0.0);
        if (delta < 0 && current + delta < 0) throw new IllegalStateException("Insufficient balance for negative adjustment");

        WalletTopUp adj = new WalletTopUp();
        adj.setId("wlt_" + UUID.randomUUID().toString().substring(0, 8));
        adj.setUserId(userId);
        adj.setAmount(delta);
        adj.setPaymentMethod("cod");
        adj.setType("adjustment");
        adj.setStatus("completed");
        adj.setReference("ADJ-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        adj.setAdminNote(adminNote);
        adj.setCreatedAt(LocalDateTime.now());
        adj.setUpdatedAt(LocalDateTime.now());
        topUpRepo.save(adj);

        updateBalance(userId, delta);
        return adj;
    }

    private void updateBalance(String userId, Double delta) {
        if (userId == null || userId.isEmpty()) throw new IllegalArgumentException("userId is required");
        Double current = balanceRepo.findById(userId).map(WalletBalance::getBalance).orElse(0.0);
        Double newBal = current + delta;
        WalletBalance b = new WalletBalance(userId, newBal);
        balanceRepo.save(b);
    }
}
