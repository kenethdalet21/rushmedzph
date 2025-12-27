package com.epharma.ecosystem.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class Payout {
    private String id;
    private String merchantId;
    private Double amount;
    private String status;
    private String payoutMethod;
    private String accountDetails;
    private LocalDateTime scheduledDate;
    private LocalDateTime completedDate;
    private List<String> transactionIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public Payout() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = "pending";
        this.transactionIds = new ArrayList<>();
    }

    public Payout(String id, String merchantId, Double amount, String payoutMethod, 
                  String accountDetails) {
        this();
        this.id = id;
        this.merchantId = merchantId;
        this.amount = amount;
        this.payoutMethod = payoutMethod;
        this.accountDetails = accountDetails;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMerchantId() { return merchantId; }
    public void setMerchantId(String merchantId) { this.merchantId = merchantId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { 
        this.status = status;
        this.updatedAt = LocalDateTime.now();
        if ("completed".equals(status)) {
            this.completedDate = LocalDateTime.now();
        }
    }

    public String getPayoutMethod() { return payoutMethod; }
    public void setPayoutMethod(String payoutMethod) { this.payoutMethod = payoutMethod; }

    public String getAccountDetails() { return accountDetails; }
    public void setAccountDetails(String accountDetails) { this.accountDetails = accountDetails; }

    public LocalDateTime getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDateTime scheduledDate) { this.scheduledDate = scheduledDate; }

    public LocalDateTime getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDateTime completedDate) { this.completedDate = completedDate; }

    public List<String> getTransactionIds() { return transactionIds; }
    public void setTransactionIds(List<String> transactionIds) { this.transactionIds = transactionIds; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
