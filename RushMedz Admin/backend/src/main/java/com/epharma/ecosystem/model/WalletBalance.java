package com.epharma.ecosystem.model;

import jakarta.persistence.*;

@Entity
@Table(name = "wallet_balances")
public class WalletBalance {
    @Id
    private String userId;

    @Column(nullable = false)
    private Double balance;

    @Column(nullable = false, length = 8)
    private String currency; // PHP

    public WalletBalance() {}

    public WalletBalance(String userId, Double balance) {
        this.userId = userId;
        this.balance = balance;
        this.currency = "PHP";
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
