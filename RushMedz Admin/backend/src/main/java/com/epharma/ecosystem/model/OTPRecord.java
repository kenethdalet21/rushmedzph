package com.epharma.ecosystem.model;

import java.time.LocalDateTime;

/**
 * OTPRecord model to store OTP details for email/phone verification
 */
public class OTPRecord {
    private String id;
    private String contactValue; // Email or phone number
    private String contactType; // "email" or "phone"
    private String otpCode;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean verified;
    private int attemptCount;
    private static final int MAX_ATTEMPTS = 5;
    private static final long OTP_VALIDITY_MINUTES = 10;

    public OTPRecord(String contactValue, String contactType, String otpCode) {
        this.id = generateId();
        this.contactValue = contactValue;
        this.contactType = contactType;
        this.otpCode = otpCode;
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES);
        this.verified = false;
        this.attemptCount = 0;
    }

    private String generateId() {
        return java.util.UUID.randomUUID().toString();
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isVerified() {
        return verified && !isExpired();
    }

    public boolean canAttempt() {
        return attemptCount < MAX_ATTEMPTS && !isExpired();
    }

    public void incrementAttempt() {
        this.attemptCount++;
    }

    public void markAsVerified() {
        this.verified = true;
    }

    // Getters
    public String getId() {
        return id;
    }

    public String getContactValue() {
        return contactValue;
    }

    public String getContactType() {
        return contactType;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public boolean getVerified() {
        return verified;
    }

    public int getAttemptCount() {
        return attemptCount;
    }

    public static int getMaxAttempts() {
        return MAX_ATTEMPTS;
    }

    public static long getOtpValidityMinutes() {
        return OTP_VALIDITY_MINUTES;
    }
}
