package com.epharma.ecosystem.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.TestPropertySource;

import org.springframework.boot.test.mock.mockito.MockBean;
import com.epharma.ecosystem.service.PaymentService;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "webhook.gcash.secret=test-gcash-secret",
    "webhook.paymaya.secret=test-paymaya-secret",
    "webhook.paypal.secret=test-paypal-secret",
    "webhook.razorpay.secret=test-razorpay-secret",
    "security.jwt.secret=TEST_JWT_SECRET_12345678901234567890123456789012",
    "security.jwt.issuer=test-issuer",
    "security.jwt.expirationMinutes=60"
})
public class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PaymentService paymentService;

    @MockBean
    private com.epharma.ecosystem.security.JwtUtil jwtUtil;

    private String hmacSha256(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hmac = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hmac) { sb.append("%02x".formatted(b)); }
        return sb.toString();
    }

    @Test
    void gcashWebhook_validSignature_returnsOk() throws Exception {
        String payload = "{\"event\":\"payment.success\"}";
        String sig = hmacSha256(payload, "test-gcash-secret");
        mockMvc.perform(post("/api/payments/webhooks/gcash")
                        .contentType("application/json")
                        .header("X-Signature", sig)
                        .content(payload))
                .andExpect(status().isOk());
    }

    @Test
    void gcashWebhook_invalidSignature_returnsUnauthorized() throws Exception {
        String payload = "{\"event\":\"payment.success\"}";
        mockMvc.perform(post("/api/payments/webhooks/gcash")
                        .contentType("application/json")
                        .header("X-Signature", "bad-signature")
                        .content(payload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void paymayaWebhook_validSignature_returnsOk() throws Exception {
        String payload = "{\"event\":\"payment.success\"}";
        String sig = hmacSha256(payload, "test-paymaya-secret");
        mockMvc.perform(post("/api/payments/webhooks/paymaya")
                        .contentType("application/json")
                        .header("PayMaya-Signature", sig)
                        .content(payload))
                .andExpect(status().isOk());
    }

    @Test
    void paymayaWebhook_invalidSignature_returnsUnauthorized() throws Exception {
        String payload = "{\"event\":\"payment.success\"}";
        mockMvc.perform(post("/api/payments/webhooks/paymaya")
                        .contentType("application/json")
                        .header("PayMaya-Signature", "bad-signature")
                        .content(payload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void paypalWebhook_validSignature_returnsOk() throws Exception {
        String payload = "{\"event\":\"payment.success\"}";
        String sig = hmacSha256(payload, "test-paypal-secret");
        mockMvc.perform(post("/api/payments/webhooks/paypal")
                        .contentType("application/json")
                        .header("Paypal-Transmission-Sig", sig)
                        .content(payload))
                .andExpect(status().isOk());
    }

    @Test
    void paypalWebhook_invalidSignature_returnsUnauthorized() throws Exception {
        String payload = "{\"event\":\"payment.success\"}";
        mockMvc.perform(post("/api/payments/webhooks/paypal")
                        .contentType("application/json")
                        .header("Paypal-Transmission-Sig", "bad-signature")
                        .content(payload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void razorpayWebhook_validSignature_returnsOk() throws Exception {
        String payload = "{\"event\":\"payment.success\"}";
        String sig = hmacSha256(payload, "test-razorpay-secret");
        mockMvc.perform(post("/api/payments/webhooks/razorpay")
                        .contentType("application/json")
                        .header("X-Razorpay-Signature", sig)
                        .content(payload))
                .andExpect(status().isOk());
    }

    @Test
    void razorpayWebhook_invalidSignature_returnsUnauthorized() throws Exception {
        String payload = "{\"event\":\"payment.success\"}";
        mockMvc.perform(post("/api/payments/webhooks/razorpay")
                        .contentType("application/json")
                        .header("X-Razorpay-Signature", "bad-signature")
                        .content(payload))
                .andExpect(status().isUnauthorized());
    }
}
