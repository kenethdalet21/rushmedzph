package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.model.Payout;
import com.epharma.ecosystem.service.PayoutService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/payouts")
@CrossOrigin(origins = "*")
public class PayoutController {

    @Autowired
    private PayoutService payoutService;

    @GetMapping
    public ResponseEntity<List<Payout>> getAllPayouts(
            @RequestParam(required = false) String merchantId) {
        
        List<Payout> payouts = payoutService.getAllPayouts(merchantId);
        return ResponseEntity.ok(payouts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payout> getPayoutById(@PathVariable String id) {
        Payout payout = payoutService.getPayoutById(id);
        if (payout != null) {
            return ResponseEntity.ok(payout);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> createPayout(@RequestBody Payout payout) {
        try {
            Payout created = payoutService.createPayout(payout);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Payout> updatePayoutStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        
        String status = body.get("status");
        Payout updated = payoutService.updatePayoutStatus(id, status);
        
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/balance/{merchantId}")
    public ResponseEntity<Map<String, Object>> getMerchantBalance(@PathVariable String merchantId) {
        Map<String, Object> balance = payoutService.getMerchantBalance(merchantId);
        return ResponseEntity.ok(balance);
    }

    @PostMapping("/request")
    public ResponseEntity<?> requestPayout(@RequestBody Map<String, Object> request) {
        try {
            String merchantId = (String) request.get("merchantId");
            Double amount = ((Number) request.get("amount")).doubleValue();
            String payoutMethod = (String) request.get("payoutMethod");
            
            @SuppressWarnings("unchecked")
            Map<String, String> accountDetails = (Map<String, String>) request.get("accountDetails");
            
            if (accountDetails == null) {
                accountDetails = new HashMap<>();
                accountDetails.put("details", request.get("accountDetails").toString());
            }
            
            Payout payout = payoutService.requestPayout(
                merchantId, amount, payoutMethod, accountDetails
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(payout);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to request payout: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/process")
    public ResponseEntity<?> processPayout(@PathVariable String id) {
        try {
            Payout processed = payoutService.processPayout(id);
            return ResponseEntity.ok(processed);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to process payout"));
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getPayoutStatistics() {
        Map<String, Object> stats = payoutService.getPayoutStatistics();
        return ResponseEntity.ok(stats);
    }
}
