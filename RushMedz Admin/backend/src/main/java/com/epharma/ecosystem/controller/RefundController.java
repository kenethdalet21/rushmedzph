package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.model.Refund;
import com.epharma.ecosystem.service.RefundService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/refunds")
@CrossOrigin(origins = "*")
public class RefundController {

    @Autowired
    private RefundService refundService;

    @GetMapping
    public ResponseEntity<List<Refund>> getAllRefunds(
            @RequestParam(required = false) String transactionId,
            @RequestParam(required = false) String orderId,
            @RequestParam(required = false) String status) {
        
        List<Refund> refunds = refundService.getAllRefunds(transactionId, orderId, status);
        return ResponseEntity.ok(refunds);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Refund> getRefundById(@PathVariable String id) {
        Refund refund = refundService.getRefundById(id);
        if (refund != null) {
            return ResponseEntity.ok(refund);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> createRefund(@RequestBody Refund refund) {
        try {
            Refund created = refundService.createRefund(refund);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to create refund"));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Refund> updateRefundStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        
        String status = body.get("status");
        Refund updated = refundService.updateRefundStatus(id, status);
        
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/process")
    public ResponseEntity<?> processRefund(@RequestBody Map<String, Object> request) {
        try {
            String transactionId = (String) request.get("transactionId");
            String orderId = (String) request.get("orderId");
            Double amount = ((Number) request.get("amount")).doubleValue();
            String reason = (String) request.get("reason");
            String processedBy = (String) request.get("processedBy");
            
            Refund refund = refundService.processRefund(
                transactionId, orderId, amount, reason, processedBy
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(refund);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to process refund"));
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getRefundStatistics(
            @RequestParam(required = false) String merchantId) {
        
        Map<String, Object> stats = refundService.getRefundStatistics(merchantId);
        return ResponseEntity.ok(stats);
    }
}
