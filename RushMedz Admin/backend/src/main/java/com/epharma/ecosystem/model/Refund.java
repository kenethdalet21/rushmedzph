package com.epharma.ecosystem.model;

import java.time.LocalDateTime;

public class Refund {
    private String id;
    private String transactionId;
    private String orderId;
    private Double amount;
    private String reason;
    private String status;
    private String processedBy;
    private String gatewayRefundId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public Refund() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = "pending";
    }

    public Refund(String id, String transactionId, String orderId, Double amount, 
                  String reason, String processedBy) {
        this();
        this.id = id;
        this.transactionId = transactionId;
        this.orderId = orderId;
        this.amount = amount;
        this.reason = reason;
        this.processedBy = processedBy;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getStatus() { return status; }
    public void setStatus(String status) { 
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public String getProcessedBy() { return processedBy; }
    public void setProcessedBy(String processedBy) { this.processedBy = processedBy; }

    public String getGatewayRefundId() { return gatewayRefundId; }
    public void setGatewayRefundId(String gatewayRefundId) { this.gatewayRefundId = gatewayRefundId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
