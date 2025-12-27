package com.epharma.ecosystem.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
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
}
