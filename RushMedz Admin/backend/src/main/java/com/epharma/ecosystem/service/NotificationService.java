package com.epharma.ecosystem.service;

import com.epharma.ecosystem.model.Notification;
import com.epharma.ecosystem.model.Notification.NotificationType;
import com.epharma.ecosystem.model.Notification.UserRole;
import com.epharma.ecosystem.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * NotificationService handles sending OTP via email or SMS
 * Integrates with multiple SMS providers (Semaphore, Infobip, Twilio, Nexmo)
 * and email providers (Gmail, SendGrid, AWS SES via SMTP)
 * 
 * Supported Philippine Mobile Providers:
 * - Globe Telecom
 * - Smart Communications
 * - Touch Mobile (TM)
 * - Talk n' Text
 * - DITO Telecommunity
 */
@Service
public class NotificationService {

    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    
    private static final Pattern PHONE_PATTERN = 
        Pattern.compile("^\\+?[1-9]\\d{1,14}$");

    @Autowired
    private SMSGatewayService smsGatewayService;

    @Autowired
    private EmailGatewayService emailGatewayService;
    
    @Autowired(required = false)
    private NotificationRepository notificationRepository;
    
    @Autowired(required = false)
    private RealTimeEventService realTimeEventService;
    
    @Value("${sms.gateway.enabled:false}")
    private boolean smsEnabled;
    
    @Value("${email.enabled:false}")
    private boolean emailEnabled;

    /**
     * Send OTP via email
     * @param email Recipient email address
     * @param otp OTP code to send
     * @return true if sent successfully, false otherwise
     */
    public boolean sendOTPByEmail(String email, String otp) {
        try {
            if (!isValidEmail(email)) {
                throw new IllegalArgumentException("Invalid email address format");
            }

            return emailGatewayService.sendOTPEmail(email, otp);
        } catch (Exception e) {
            System.err.println("Failed to send email OTP: " + e.getMessage());
            return false;
        }
    }

    /**
     * Send OTP via SMS
     * @param phoneNumber Recipient phone number in E.164 format
     * @param otp OTP code to send
     * @return true if sent successfully, false otherwise
     */
    public boolean sendOTPBySMS(String phoneNumber, String otp) {
        try {
            if (!isValidPhoneNumber(phoneNumber)) {
                throw new IllegalArgumentException("Invalid phone number format. Use E.164 format (e.g., +639123456789)");
            }

            String message = "Your E-Pharmacy OTP code is: " + otp + "\nValid for 10 minutes.\nDo not share this code with anyone.";
            return smsGatewayService.sendSMS(phoneNumber, message);
        } catch (Exception e) {
            System.err.println("Failed to send SMS OTP: " + e.getMessage());
            return false;
        }
    }

    /**
     * Send OTP via email or SMS based on contact type
     * @param contactValue Email address or phone number
     * @param contactType "email" or "phone"
     * @param otp OTP code to send
     * @return true if sent successfully, false otherwise
     */
    public boolean sendOTP(String contactValue, String contactType, String otp) {
        if ("email".equalsIgnoreCase(contactType)) {
            return sendOTPByEmail(contactValue, otp);
        } else if ("phone".equalsIgnoreCase(contactType)) {
            return sendOTPBySMS(contactValue, otp);
        } else {
            throw new IllegalArgumentException("Invalid contact type: " + contactType);
        }
    }

    /**
     * Validate email address format
     * @param email Email address to validate
     * @return true if valid email format, false otherwise
     */
    private boolean isValidEmail(String email) {
        return email != null && !email.isEmpty() && EMAIL_PATTERN.matcher(email).matches();
    }

    /**
     * Validate phone number format (E.164 format)
     * @param phoneNumber Phone number to validate
     * @return true if valid phone number format, false otherwise
     */
    private boolean isValidPhoneNumber(String phoneNumber) {
        return phoneNumber != null && !phoneNumber.isEmpty() && PHONE_PATTERN.matcher(phoneNumber).matches();
    }
    
    /**
     * Check if running in production mode (both SMS and Email are enabled)
     * @return true if in production mode, false if in development mode
     */
    public boolean isProductionMode() {
        return smsEnabled && emailEnabled;
    }

    // ==================== ECOSYSTEM NOTIFICATION METHODS ====================

    /**
     * Create a general notification and save to database
     */
    public Notification createNotification(String userId, UserRole userRole, 
            String title, String message, NotificationType type, 
            String referenceId, String referenceType) {
        if (notificationRepository == null) return null;
        
        Notification notification = new Notification();
        notification.setId(UUID.randomUUID().toString());
        notification.setUserId(userId);
        notification.setUserRole(userRole);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setNotificationType(type);
        notification.setReferenceId(referenceId);
        notification.setReferenceType(referenceType);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        Notification saved = notificationRepository.save(notification);
        
        // Broadcast real-time notification if service available
        if (realTimeEventService != null) {
            realTimeEventService.broadcastNotification(saved);
        }
        
        return saved;
    }

    /**
     * Send prescription-related notification
     */
    public void sendPrescriptionNotification(String userId, String title, 
            String message, String prescriptionId, String notificationType) {
        UserRole role = UserRole.USER;
        NotificationType type = NotificationType.PRESCRIPTION_UPLOADED;
        
        switch (notificationType) {
            case "PRESCRIPTION_UPLOADED":
                role = UserRole.DOCTOR;
                type = NotificationType.PRESCRIPTION_UPLOADED;
                break;
            case "PRESCRIPTION_APPROVED":
                role = UserRole.USER;
                type = NotificationType.PRESCRIPTION_APPROVED;
                break;
            case "PRESCRIPTION_REJECTED":
                role = UserRole.USER;
                type = NotificationType.PRESCRIPTION_REJECTED;
                break;
            case "PRESCRIPTION_EXPIRING":
                role = UserRole.USER;
                type = NotificationType.PRESCRIPTION_EXPIRING;
                break;
        }
        
        createNotification(userId, role, title, message, type, prescriptionId, "PRESCRIPTION");
    }

    /**
     * Send consultation-related notification
     */
    public void sendConsultationNotification(String userId, String title, 
            String message, String consultationId, String notificationType) {
        UserRole role = UserRole.USER;
        NotificationType type = NotificationType.CONSULTATION_REQUESTED;
        
        switch (notificationType) {
            case "CONSULTATION_REQUESTED":
                role = UserRole.DOCTOR;
                type = NotificationType.CONSULTATION_REQUESTED;
                break;
            case "CONSULTATION_ACCEPTED":
                role = UserRole.USER;
                type = NotificationType.CONSULTATION_ACCEPTED;
                break;
            case "CONSULTATION_STARTED":
                role = UserRole.USER;
                type = NotificationType.CONSULTATION_STARTED;
                break;
            case "CONSULTATION_ENDED":
                role = UserRole.USER;
                type = NotificationType.CONSULTATION_ENDED;
                break;
            case "CONSULTATION_CANCELLED":
                role = UserRole.USER;
                type = NotificationType.CONSULTATION_CANCELLED;
                break;
        }
        
        createNotification(userId, role, title, message, type, consultationId, "CONSULTATION");
    }

    /**
     * Send delivery-related notification
     */
    public void sendDeliveryNotification(String userId, String title, 
            String message, String deliveryId, String notificationType) {
        UserRole role = UserRole.USER;
        NotificationType type = NotificationType.DELIVERY_ASSIGNED;
        
        switch (notificationType) {
            case "DELIVERY_ASSIGNED":
                role = UserRole.DRIVER;
                type = NotificationType.DELIVERY_ASSIGNED;
                break;
            case "DELIVERY_ACCEPTED":
                role = UserRole.USER;
                type = NotificationType.DELIVERY_ACCEPTED;
                break;
            case "DELIVERY_PICKED_UP":
                role = UserRole.USER;
                type = NotificationType.DELIVERY_PICKED_UP;
                break;
            case "DELIVERY_EN_ROUTE":
                role = UserRole.USER;
                type = NotificationType.DELIVERY_EN_ROUTE;
                break;
            case "DELIVERY_ARRIVED":
                role = UserRole.USER;
                type = NotificationType.DELIVERY_ARRIVED;
                break;
            case "DELIVERY_COMPLETED":
                role = UserRole.USER;
                type = NotificationType.DELIVERY_COMPLETED;
                break;
            case "DRIVER_DELIVERY_COMPLETED":
                role = UserRole.DRIVER;
                type = NotificationType.DELIVERY_COMPLETED;
                break;
        }
        
        createNotification(userId, role, title, message, type, deliveryId, "DELIVERY");
    }

    /**
     * Get notifications for user
     */
    public List<Notification> getNotificationsByUserId(String userId) {
        if (notificationRepository == null) return List.of();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get unread count
     */
    public long getUnreadCount(String userId) {
        if (notificationRepository == null) return 0;
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Mark notification as read
     */
    public Notification markAsRead(String notificationId) {
        if (notificationRepository == null) return null;
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    /**
     * Mark all notifications as read
     */
    public void markAllAsRead(String userId) {
        if (notificationRepository != null) {
            notificationRepository.markAllAsRead(userId, LocalDateTime.now());
        }
    }
}
