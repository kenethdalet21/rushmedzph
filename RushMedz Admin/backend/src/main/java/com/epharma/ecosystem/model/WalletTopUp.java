package com.epharma.ecosystem.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallet_topups")
public class WalletTopUp {
    @Id
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false, length = 8)
    private String currency; // PHP

    @Column(nullable = false, length = 32)
    private String paymentMethod; // exclude 'wallet'

    @Column(nullable = false, length = 16)
    private String status; // processing|completed|failed|refunded

    @Column(nullable = false, length = 16)
    private String type; // topup|adjustment|refund

    @Column(length = 64)
    private String reference;

    @Column(length = 255)
    private String adminNote;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WalletTopUp() {
        this.currency = "PHP";
        this.type = "topup";
        this.status = "processing";
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) this.id = "wlt_" + java.util.UUID.randomUUID().toString().substring(0, 8);
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // getters/setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public String getAdminNote() { return adminNote; }
    public void setAdminNote(String adminNote) { this.adminNote = adminNote; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
