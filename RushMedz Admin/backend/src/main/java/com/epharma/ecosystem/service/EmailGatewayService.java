package com.epharma.ecosystem.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

/**
 * EmailGatewayService handles email sending through various providers
 * Supports: Gmail, SendGrid, AWS SES, Mailgun, etc.
 */
@Service
public class EmailGatewayService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${email.enabled:false}")
    private boolean emailEnabled;

    @Value("${email.from:noreply@epharma.com}")
    private String fromEmail;

    @Value("${email.from-name:E-Pharmacy}")
    private String fromName;

    @Value("${email.provider:smtp}")
    private String emailProvider;

    /**
     * Send OTP email
     * @param recipient Email address
     * @param otp OTP code
     * @return true if sent successfully, false otherwise
     */
    public boolean sendOTPEmail(String recipient, String otp) {
        String subject = "E-Pharmacy OTP Verification";
        String body = buildOTPEmailBody(otp);
        return sendEmail(recipient, subject, body, true);
    }

    /**
     * Send generic email
     * @param recipient Email address
     * @param subject Email subject
     * @param body Email body (HTML if htmlContent=true)
     * @param htmlContent Whether body is HTML content
     * @return true if sent successfully, false otherwise
     */
    public boolean sendEmail(String recipient, String subject, String body, boolean htmlContent) {
        // Validate inputs
        if (recipient == null || recipient.trim().isEmpty()) {
            System.err.println("Invalid recipient email address");
            return false;
        }
        
        if (subject == null || subject.trim().isEmpty()) {
            System.err.println("Invalid email subject");
            return false;
        }
        
        if (body == null || body.trim().isEmpty()) {
            System.err.println("Invalid email body");
            return false;
        }
        
        if (!emailEnabled) {
            logEmail(recipient, subject, body);
            return true;
        }

        try {
            if (mailSender != null) {
                return sendViaJavaMailSender(recipient, subject, body, htmlContent);
            } else {
                logEmail(recipient, subject, body);
                return true;
            }
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Send email using JavaMailSender (configured SMTP)
     */
    private boolean sendViaJavaMailSender(String recipient, String subject, String body, boolean htmlContent) {
        try {
            // Ensure all required fields are non-null
            String safeFromEmail = fromEmail != null ? fromEmail : "noreply@epharma.com";
            String safeFromName = fromName != null ? fromName : "E-Pharmacy";
            String safeRecipient = recipient != null ? recipient : "";
            String safeSubject = subject != null ? subject : "";
            String safeBody = body != null ? body : "";
            
            if (safeRecipient.trim().isEmpty() || safeSubject.trim().isEmpty() || safeBody.trim().isEmpty()) {
                System.err.println("Missing required email fields");
                return false;
            }
            
            if (htmlContent) {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true);
                helper.setFrom(safeFromEmail, safeFromName);
                helper.setTo(safeRecipient);
                helper.setSubject(safeSubject);
                helper.setText(safeBody, true);
                mailSender.send(message);
            } else {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(safeFromEmail);
                message.setTo(safeRecipient);
                message.setSubject(safeSubject);
                message.setText(safeBody);
                mailSender.send(message);
            }
            return true;
        } catch (Exception e) {
            System.err.println("Failed to send email via " + emailProvider + ": " + e.getMessage());
            return false;
        }
    }

    /**
     * Build OTP email body with HTML formatting
     */
    private String buildOTPEmailBody(String otp) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<style>" +
                "body { font-family: Arial, sans-serif; background-color: #f5f5f5; }" +
                ".container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }" +
                ".header { text-align: center; color: #2c3e50; margin-bottom: 20px; }" +
                ".otp-box { background-color: #ecf0f1; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }" +
                ".otp-code { font-size: 32px; font-weight: bold; color: #27ae60; letter-spacing: 5px; }" +
                ".footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 20px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<h2>E-Pharmacy OTP Verification</h2>" +
                "</div>" +
                "<p>Hello,</p>" +
                "<p>Your One-Time Password (OTP) for E-Pharmacy verification is:</p>" +
                "<div class='otp-box'>" +
                "<div class='otp-code'>" + otp + "</div>" +
                "</div>" +
                "<p><strong>Important:</strong></p>" +
                "<ul>" +
                "<li>This OTP is valid for <strong>10 minutes</strong> only</li>" +
                "<li>Do not share this code with anyone</li>" +
                "<li>E-Pharmacy staff will never ask for your OTP</li>" +
                "</ul>" +
                "<p>If you didn't request this OTP, please ignore this email.</p>" +
                "<div class='footer'>" +
                "<p>© 2025 E-Pharmacy. All rights reserved.</p>" +
                "<p>This is an automated message, please do not reply.</p>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Log email for development/testing
     */
    private void logEmail(String recipient, String subject, String body) {
        System.out.println("========================================");
        System.out.println("EMAIL NOTIFICATION (Development Mode)");
        System.out.println("========================================");
        System.out.println("Provider: " + (emailEnabled ? emailProvider : "DISABLED - Console Logging Only"));
        System.out.println("From: " + fromName + " <" + fromEmail + ">");
        System.out.println("To: " + recipient);
        System.out.println("Subject: " + subject);
        System.out.println("----------------------------------------");
        System.out.println("Body: " + body);
        System.out.println("========================================");
    }

    /**
     * Check if email service is properly configured
     */
    public boolean isConfigured() {
        return emailEnabled && mailSender != null;
    }

    /**
     * Get current email provider
     */
    public String getProvider() {
        return emailProvider;
    }
}
