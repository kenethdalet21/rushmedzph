package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.service.DeliveryStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/delivery")
public class DeliveryStatusController {

    @Autowired
    private DeliveryStatusService deliveryStatusService;

    @PostMapping("/update")
    public ResponseEntity<?> updateDeliveryStatus(@RequestBody Map<String, String> statusUpdate) {
        try {
            deliveryStatusService.updateStatus(statusUpdate);
            return ResponseEntity.ok("Delivery status updated successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error updating delivery status: " + e.getMessage());
        }
    }

    @GetMapping("/status/{orderId}")
    public ResponseEntity<?> getDeliveryStatus(@PathVariable String orderId) {
        try {
            String status = deliveryStatusService.getStatus(orderId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching delivery status: " + e.getMessage());
        }
    }
}