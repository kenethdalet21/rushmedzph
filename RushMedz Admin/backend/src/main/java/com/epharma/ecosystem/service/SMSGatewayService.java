package com.epharma.ecosystem.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * SMSGatewayService handles SMS sending through Philippine mobile providers
 * Supports: Globe, Smart, TM (Touch Mobile), Talk n' Text, DITO
 */
@Service
public class SMSGatewayService {

    // SMS Gateway Configuration - Update with your provider credentials
    @Value("${sms.gateway.provider:semaphore}")
    private String smsProvider;

    @Value("${sms.gateway.api-key:}")
    private String apiKey;

    @Value("${sms.gateway.sender-id:EPHARMA}")
    private String senderId;

    @Value("${sms.gateway.enabled:false}")
    private boolean smsEnabled;

    /**
     * Send SMS using configured gateway
     * @param phoneNumber Recipient phone number in E.164 format
     * @param message SMS message content
     * @return true if sent successfully, false otherwise
     */
    public boolean sendSMS(String phoneNumber, String message) {
        if (!smsEnabled) {
            logSMS(phoneNumber, message);
            return true;
        }

        try {
            // Convert E.164 format to Philippine local format if needed
            String localPhoneNumber = convertToLocalFormat(phoneNumber);

            switch (smsProvider.toLowerCase()) {
                case "semaphore":
                    return sendViaSemaphore(localPhoneNumber, message);
                case "infobip":
                    return sendViaInfobip(localPhoneNumber, message);
                case "twilio":
                    return sendViaTwilio(localPhoneNumber, message);
                case "nexmo":
                    return sendViaNexmo(localPhoneNumber, message);
                default:
                    logSMS(phoneNumber, message);
                    return true;
            }
        } catch (Exception e) {
            System.err.println("Failed to send SMS: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Send SMS via Semaphore (Popular in Philippines)
     * Supports Globe, Smart, TM, Talk n' Text, DITO
     * API: https://semaphore.co/
     */
    private boolean sendViaSemaphore(String phoneNumber, String message) throws Exception {
        String apiUrl = "https://api.semaphore.co/api/sms/send";
        
        String payload = "apikey=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
                + "&number=" + URLEncoder.encode(phoneNumber, StandardCharsets.UTF_8)
                + "&message=" + URLEncoder.encode(message, StandardCharsets.UTF_8)
                + "&sendername=" + URLEncoder.encode(senderId, StandardCharsets.UTF_8);

        return sendHTTPRequest(apiUrl, payload, "POST");
    }

    /**
     * Send SMS via Infobip (Supports Philippine providers)
     * API: https://www.infobip.com/
     */
    private boolean sendViaInfobip(String phoneNumber, String message) throws Exception {
        String apiUrl = "https://api.infobip.com/sms/1/text/single";
        
        String jsonPayload = "{"
                + "\"to\":\"" + phoneNumber + "\","
                + "\"from\":\"" + senderId + "\","
                + "\"text\":\"" + escapeJSON(message) + "\""
                + "}";

        URL url = URI.create(apiUrl).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "App " + apiKey);
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }

        int responseCode = conn.getResponseCode();
        return responseCode >= 200 && responseCode < 300;
    }

    /**
     * Send SMS via Twilio (Global coverage including Philippines)
     * API: https://www.twilio.com/
     */
    private boolean sendViaTwilio(String phoneNumber, String message) throws Exception {
        String apiUrl = "https://api.twilio.com/2010-04-01/Accounts/" + apiKey + "/Messages.json";
        
        String payload = "To=" + URLEncoder.encode(phoneNumber, StandardCharsets.UTF_8)
                + "&From=" + URLEncoder.encode(senderId, StandardCharsets.UTF_8)
                + "&Body=" + URLEncoder.encode(message, StandardCharsets.UTF_8);

        // Note: Twilio uses Basic Auth with Account SID and Auth Token
        return sendHTTPRequest(apiUrl, payload, "POST");
    }

    /**
     * Send SMS via Nexmo/Vonage (Global SMS coverage)
     * API: https://www.vonage.com/communications-apis/sms/
     */
    private boolean sendViaNexmo(String phoneNumber, String message) throws Exception {
        String apiUrl = "https://rest.nexmo.com/sms/json";
        
        String payload = "api_key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
                + "&to=" + URLEncoder.encode(phoneNumber, StandardCharsets.UTF_8)
                + "&from=" + URLEncoder.encode(senderId, StandardCharsets.UTF_8)
                + "&text=" + URLEncoder.encode(message, StandardCharsets.UTF_8);

        return sendHTTPRequest(apiUrl, payload, "POST");
    }

    /**
     * Send generic HTTP request
     */
    private boolean sendHTTPRequest(String apiUrl, String payload, String method) throws Exception {
        URL url = URI.create(apiUrl).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = payload.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }

        int responseCode = conn.getResponseCode();
        boolean success = responseCode >= 200 && responseCode < 300;
        
        if (!success) {
            System.err.println("SMS Gateway Response Code: " + responseCode);
        }
        
        return success;
    }

    /**
     * Convert E.164 format to local Philippine format
     * E.164: +639123456789 -> Local: 09123456789
     */
    private String convertToLocalFormat(String phoneNumber) {
        if (phoneNumber.startsWith("+63")) {
            return "0" + phoneNumber.substring(3);
        }
        return phoneNumber;
    }

    /**
     * Escape JSON special characters
     */
    private String escapeJSON(String str) {
        return str.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    /**
     * Log SMS for development/testing
     */
    private void logSMS(String phoneNumber, String message) {
        System.out.println("========================================");
        System.out.println("SMS NOTIFICATION (Development Mode)");
        System.out.println("========================================");
        System.out.println("Provider: " + (smsEnabled ? smsProvider : "DISABLED - Console Logging Only"));
        System.out.println("To: " + phoneNumber);
        System.out.println("From: " + senderId);
        System.out.println("Message: " + message);
        System.out.println("========================================");
    }

    /**
     * Check if SMS gateway is properly configured
     */
    public boolean isConfigured() {
        return smsEnabled && apiKey != null && !apiKey.isEmpty();
    }

    /**
     * Get current SMS provider
     */
    public String getProvider() {
        return smsProvider;
    }
}
