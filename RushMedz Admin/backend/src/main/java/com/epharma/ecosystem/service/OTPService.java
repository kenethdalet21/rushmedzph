package com.epharma.ecosystem.service;

import com.epharma.ecosystem.model.OTPRecord;
import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * OTPService handles OTP generation, storage, and validation
 * Uses in-memory storage for demo purposes (replace with database for production)
 */
@Service
public class OTPService {
    private final ConcurrentHashMap<String, OTPRecord> otpStore = new ConcurrentHashMap<>();

    /**
     * Generate and store OTP for a contact (email or phone)
     * @param contactValue Email address or phone number
     * @param contactType "email" or "phone"
     * @return OTP code
     */
    public String generateOTP(String contactValue, String contactType) {
        if (contactValue == null || contactValue.trim().isEmpty()) {
            throw new IllegalArgumentException("Contact value cannot be empty");
        }

        if (!("email".equalsIgnoreCase(contactType) || "phone".equalsIgnoreCase(contactType))) {
            throw new IllegalArgumentException("Contact type must be 'email' or 'phone'");
        }

        // Generate 6-digit OTP
        String otpCode = generateRandomOTP();
        
        // Create OTP record
        OTPRecord record = new OTPRecord(contactValue, contactType, otpCode);
        
        // Store with key combining contact type and value
        String key = generateKey(contactValue, contactType);
        otpStore.put(key, record);

        return otpCode;
    }

    /**
     * Verify OTP code
     * @param contactValue Email address or phone number
     * @param contactType "email" or "phone"
     * @param otpCode OTP code to verify
     * @return true if OTP is valid, false otherwise
     */
    public boolean verifyOTP(String contactValue, String contactType, String otpCode) {
        String key = generateKey(contactValue, contactType);
        OTPRecord record = otpStore.get(key);

        if (record == null) {
            return false;
        }

        // Check if expired
        if (record.isExpired()) {
            otpStore.remove(key);
            return false;
        }

        // Check if already verified
        if (record.isVerified()) {
            return false;
        }

        // Check if max attempts exceeded
        if (!record.canAttempt()) {
            otpStore.remove(key);
            return false;
        }

        // Increment attempt
        record.incrementAttempt();

        // Verify OTP code
        if (otpCode != null && otpCode.equals(record.getOtpCode())) {
            record.markAsVerified();
            return true;
        }

        return false;
    }

    /**
     * Check if OTP is verified
     * @param contactValue Email address or phone number
     * @param contactType "email" or "phone"
     * @return true if OTP is verified
     */
    public boolean isOTPVerified(String contactValue, String contactType) {
        String key = generateKey(contactValue, contactType);
        OTPRecord record = otpStore.get(key);
        return record != null && record.isVerified();
    }

    /**
     * Resend OTP to a contact
     * @param contactValue Email address or phone number
     * @param contactType "email" or "phone"
     * @return New OTP code
     */
    public String resendOTP(String contactValue, String contactType) {
        // Remove old OTP
        String key = generateKey(contactValue, contactType);
        otpStore.remove(key);

        // Generate new OTP
        return generateOTP(contactValue, contactType);
    }

    /**
     * Clear OTP for a contact
     * @param contactValue Email address or phone number
     * @param contactType "email" or "phone"
     */
    public void clearOTP(String contactValue, String contactType) {
        String key = generateKey(contactValue, contactType);
        otpStore.remove(key);
    }

    /**
     * Get remaining attempts for OTP
     * @param contactValue Email address or phone number
     * @param contactType "email" or "phone"
     * @return Remaining attempts, -1 if no record found
     */
    public int getRemainingAttempts(String contactValue, String contactType) {
        String key = generateKey(contactValue, contactType);
        OTPRecord record = otpStore.get(key);
        
        if (record == null || record.isExpired()) {
            return -1;
        }

        return OTPRecord.getMaxAttempts() - record.getAttemptCount();
    }

    private String generateRandomOTP() {
        int otp = 100000 + (int) (ThreadLocalRandom.current().nextDouble() * 900000);
        return String.valueOf(otp);
    }

    private String generateKey(String contactValue, String contactType) {
        return contactType.toLowerCase() + ":" + contactValue.toLowerCase();
    }
}
