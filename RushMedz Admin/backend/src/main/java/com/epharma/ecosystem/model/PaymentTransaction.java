package com.epharma.ecosystem.model;

import java.time.LocalDateTime;

public class PaymentTransaction {
    private String id;
    private String orderId;
    private String userId;
    private String merchantId;
    private Double amount;
    private String currency;
    private String paymentMethod;
    private String status;
    private String gatewayTransactionId;
    private String gatewayResponse;
    private Double refundedAmount;
    private Double processingFee;
    private Double netAmount;
    private String metadata;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public PaymentTransaction() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.refundedAmount = 0.0;
        this.processingFee = 0.0;
    }

    public PaymentTransaction(String id, String orderId, String userId, String merchantId, 
                             Double amount, String currency, String paymentMethod, String status) {
        this();
        this.id = id;
        this.orderId = orderId;
        this.userId = userId;
        this.merchantId = merchantId;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
        this.status = status;
        calculateNetAmount();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getMerchantId() { return merchantId; }
    public void setMerchantId(String merchantId) { this.merchantId = merchantId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { 
        this.amount = amount;
        calculateNetAmount();
    }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getStatus() { return status; }
    public void setStatus(String status) { 
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public String getGatewayTransactionId() { return gatewayTransactionId; }
    public void setGatewayTransactionId(String gatewayTransactionId) { 
        this.gatewayTransactionId = gatewayTransactionId; 
    }

    public String getGatewayResponse() { return gatewayResponse; }
    public void setGatewayResponse(String gatewayResponse) { this.gatewayResponse = gatewayResponse; }

    public Double getRefundedAmount() { return refundedAmount; }
    public void setRefundedAmount(Double refundedAmount) { 
        this.refundedAmount = refundedAmount;
        calculateNetAmount();
    }

    public Double getProcessingFee() { return processingFee; }
    public void setProcessingFee(Double processingFee) { 
        this.processingFee = processingFee;
        calculateNetAmount();
    }

    public Double getNetAmount() { return netAmount; }
    public void setNetAmount(Double netAmount) { this.netAmount = netAmount; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper methods
    private void calculateNetAmount() {
        if (amount != null && processingFee != null && refundedAmount != null) {
            this.netAmount = amount - processingFee - refundedAmount;
        }
    }

    public void calculateProcessingFee() {
        if (amount != null) {
            // Different fee structures for different payment methods
            switch (paymentMethod.toLowerCase()) {
                case "gcash":
                case "paymaya":
                    this.processingFee = amount * 0.025; // 2.5%
                    break;
                case "paypal":
                    this.processingFee = amount * 0.034 + 15.0; // 3.4% + 15 PHP
                    break;
                case "razorpay":
                    this.processingFee = amount * 0.02; // 2%
                    break;
                case "card":
                    this.processingFee = amount * 0.03; // 3%
                    break;
                case "cod":
                    this.processingFee = 0.0; // No fee for COD
                    break;
                default:
                    this.processingFee = amount * 0.025; // Default 2.5%
            }
            calculateNetAmount();
        }
    }
}
