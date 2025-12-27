package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.service.OTPService;
import com.epharma.ecosystem.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * OTPController handles OTP-related endpoints for email and phone verification
 */
@RestController
@RequestMapping("/api/otp")
@CrossOrigin(origins = "*")
public class OTPController {

    @Autowired
    private OTPService otpService;

    @Autowired
    private NotificationService notificationService;

    /**
     * Send OTP to email or phone
     * POST /api/otp/send
     * Body: { "contactValue": "email@example.com", "contactType": "email" }
     *       { "contactValue": "+639123456789", "contactType": "phone" }
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendOTP(@RequestBody Map<String, String> body) {
        try {
            String contactValue = body.get("contactValue");
            String contactType = body.get("contactType");

            if (contactValue == null || contactValue.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Contact value is required"
                ));
            }

            if (contactType == null || contactType.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Contact type is required"
                ));
            }

            // Validate contact type
            if (!("email".equalsIgnoreCase(contactType) || "phone".equalsIgnoreCase(contactType))) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Contact type must be 'email' or 'phone'"
                ));
            }

            // Generate OTP
            String otpCode = otpService.generateOTP(contactValue, contactType);

            // Send OTP via email or SMS
            boolean sent = notificationService.sendOTP(contactValue, contactType, otpCode);

            if (sent) {
                // In development mode (SMS/Email disabled), return OTP code for testing
                // In production, never expose the OTP code in response
                boolean isDevelopment = !notificationService.isProductionMode();
                
                if (isDevelopment) {
                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "message", "OTP sent successfully to " + contactType,
                            "otpCode", otpCode,
                            "note", "Development mode: OTP code shown for testing. In production, this will be hidden."
                    ));
                } else {
                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "message", "OTP sent successfully to " + contactType
                    ));
                }
            } else {
                return ResponseEntity.internalServerError().body(Map.of(
                        "success", false,
                        "message", "Failed to send OTP to " + contactType
                ));
            }

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Failed to send OTP: " + e.getMessage()
            ));
        }
    }

    /**
     * Verify OTP
     * POST /api/otp/verify
     * Body: { "contactValue": "email@example.com", "contactType": "email", "otpCode": "123456" }
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyOTP(@RequestBody Map<String, String> body) {
        try {
            String contactValue = body.get("contactValue");
            String contactType = body.get("contactType");
            String otpCode = body.get("otpCode");

            if (contactValue == null || contactValue.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Contact value is required"
                ));
            }

            if (contactType == null || contactType.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Contact type is required"
                ));
            }

            if (otpCode == null || otpCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "OTP code is required"
                ));
            }

            // Verify OTP
            boolean isValid = otpService.verifyOTP(contactValue, contactType, otpCode);

            if (isValid) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", contactType + " verified successfully",
                        "verified", true
                ));
            } else {
                int remainingAttempts = otpService.getRemainingAttempts(contactValue, contactType);
                return ResponseEntity.ok(Map.of(
                        "success", false,
                        "message", "Invalid OTP code",
                        "verified", false,
                        "remainingAttempts", Math.max(0, remainingAttempts)
                ));
            }

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Failed to verify OTP: " + e.getMessage()
            ));
        }
    }

    /**
     * Resend OTP to email or phone
     * POST /api/otp/resend
     * Body: { "contactValue": "email@example.com", "contactType": "email" }
     */
    @PostMapping("/resend")
    public ResponseEntity<?> resendOTP(@RequestBody Map<String, String> body) {
        try {
            String contactValue = body.get("contactValue");
            String contactType = body.get("contactType");

            if (contactValue == null || contactValue.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Contact value is required"
                ));
            }

            if (contactType == null || contactType.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Contact type is required"
                ));
            }

            // Resend OTP
            String newOtpCode = otpService.resendOTP(contactValue, contactType);

            // Send OTP via email or SMS
            boolean sent = notificationService.sendOTP(contactValue, contactType, newOtpCode);

            if (sent) {
                // In development mode, return OTP code for testing
                boolean isDevelopment = !notificationService.isProductionMode();
                
                if (isDevelopment) {
                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "message", "OTP resent successfully to " + contactType,
                            "otpCode", newOtpCode,
                            "note", "Development mode: OTP code shown for testing."
                    ));
                } else {
                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "message", "OTP resent successfully to " + contactType
                    ));
                }
            } else {
                return ResponseEntity.internalServerError().body(Map.of(
                        "success", false,
                        "message", "Failed to resend OTP to " + contactType
                ));
            }

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Failed to resend OTP: " + e.getMessage()
            ));
        }
    }

    /**
     * Check if contact is verified
     * POST /api/otp/check-verification
     * Body: { "contactValue": "email@example.com", "contactType": "email" }
     */
    @PostMapping("/check-verification")
    public ResponseEntity<?> checkVerification(@RequestBody Map<String, String> body) {
        try {
            String contactValue = body.get("contactValue");
            String contactType = body.get("contactType");

            if (contactValue == null || contactValue.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Contact value is required"
                ));
            }

            if (contactType == null || contactType.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Contact type is required"
                ));
            }

            boolean isVerified = otpService.isOTPVerified(contactValue, contactType);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "verified", isVerified
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Failed to check verification: " + e.getMessage()
            ));
        }
    }
}
