package com.epharma.ecosystem.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * Notification entity - Stores notifications for all app users
 * Enables real-time push notifications across the ecosystem
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_user", columnList = "user_id"),
    @Index(name = "idx_notification_type", columnList = "notification_type"),
    @Index(name = "idx_notification_read", columnList = "is_read"),
    @Index(name = "idx_notification_created", columnList = "created_at")
})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull(message = "User ID is required")
    @Column(name = "user_id", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_role")
    private UserRole userRole;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    private NotificationType notificationType;

    @Column(name = "reference_id")
    private String referenceId;

    @Column(name = "reference_type")
    private String referenceType;

    @Column(name = "action_url")
    private String actionUrl;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "is_push_sent")
    private Boolean isPushSent = false;

    @Column(name = "push_sent_at")
    private LocalDateTime pushSentAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum UserRole {
        ADMIN,
        MERCHANT,
        DRIVER,
        DOCTOR,
        USER
    }

    public enum NotificationType {
        // Order related
        ORDER_PLACED,
        ORDER_CONFIRMED,
        ORDER_PREPARING,
        ORDER_READY,
        ORDER_PICKED_UP,
        ORDER_IN_TRANSIT,
        ORDER_DELIVERED,
        ORDER_CANCELLED,
        
        // Delivery related
        DELIVERY_ASSIGNED,
        DELIVERY_ACCEPTED,
        DELIVERY_PICKUP_ARRIVED,
        DELIVERY_EN_ROUTE,
        DELIVERY_ARRIVED,
        DELIVERY_COMPLETED,
        
        // Prescription related
        PRESCRIPTION_UPLOADED,
        PRESCRIPTION_UNDER_REVIEW,
        PRESCRIPTION_APPROVED,
        PRESCRIPTION_REJECTED,
        PRESCRIPTION_EXPIRING,
        
        // Consultation related
        CONSULTATION_REQUESTED,
        CONSULTATION_SCHEDULED,
        CONSULTATION_REMINDER,
        CONSULTATION_STARTED,
        CONSULTATION_ENDED,
        CONSULTATION_CANCELLED,
        CONSULTATION_ACCEPTED,
        
        // Additional delivery statuses
        DELIVERY_PICKED_UP,
        
        // Payment related
        PAYMENT_RECEIVED,
        PAYMENT_FAILED,
        REFUND_PROCESSED,
        PAYOUT_COMPLETED,
        WALLET_CREDITED,
        WALLET_DEBITED,
        
        // Chat related
        NEW_MESSAGE,
        
        // System related
        ACCOUNT_VERIFIED,
        PROFILE_UPDATED,
        SYSTEM_ALERT,
        PROMOTION
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public Notification() {}

    public Notification(String userId, String title, String message, NotificationType notificationType) {
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.notificationType = notificationType;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public UserRole getUserRole() { return userRole; }
    public void setUserRole(UserRole userRole) { this.userRole = userRole; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public NotificationType getNotificationType() { return notificationType; }
    public void setNotificationType(NotificationType notificationType) { this.notificationType = notificationType; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }

    public String getActionUrl() { return actionUrl; }
    public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
    
    // Alias for setIsRead for convenience
    public void setRead(boolean read) { this.isRead = read; }

    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }

    public Boolean getIsPushSent() { return isPushSent; }
    public void setIsPushSent(Boolean isPushSent) { this.isPushSent = isPushSent; }

    public LocalDateTime getPushSentAt() { return pushSentAt; }
    public void setPushSentAt(LocalDateTime pushSentAt) { this.pushSentAt = pushSentAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
