package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.model.Prescription;
import com.epharma.ecosystem.model.Prescription.PrescriptionStatus;
import com.epharma.ecosystem.model.PrescriptionItem;
import com.epharma.ecosystem.service.PrescriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Prescription operations
 * Provides API endpoints for prescription management across the ecosystem
 */
@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "*")
public class PrescriptionController {

    @Autowired
    private PrescriptionService prescriptionService;

    // Create prescription
    @PostMapping
    public ResponseEntity<Prescription> createPrescription(@RequestBody Prescription prescription) {
        Prescription created = prescriptionService.createPrescription(prescription);
        return ResponseEntity.ok(created);
    }

    // Get prescription by ID
    @GetMapping("/{id}")
    public ResponseEntity<Prescription> getPrescriptionById(@PathVariable String id) {
        return prescriptionService.getPrescriptionById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Get prescriptions by user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Prescription>> getPrescriptionsByUser(@PathVariable String userId) {
        List<Prescription> prescriptions = prescriptionService.getPrescriptionsByUserId(userId);
        return ResponseEntity.ok(prescriptions);
    }

    // Get prescriptions by doctor
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Prescription>> getPrescriptionsByDoctor(@PathVariable String doctorId) {
        List<Prescription> prescriptions = prescriptionService.getPrescriptionsByDoctorId(doctorId);
        return ResponseEntity.ok(prescriptions);
    }

    // Get pending prescriptions for doctor
    @GetMapping("/doctor/{doctorId}/pending")
    public ResponseEntity<List<Prescription>> getPendingPrescriptionsForDoctor(@PathVariable String doctorId) {
        List<Prescription> prescriptions = prescriptionService.getPendingPrescriptionsForDoctor(doctorId);
        return ResponseEntity.ok(prescriptions);
    }

    // Get valid prescriptions for user
    @GetMapping("/user/{userId}/valid")
    public ResponseEntity<List<Prescription>> getValidPrescriptionsForUser(@PathVariable String userId) {
        List<Prescription> prescriptions = prescriptionService.getValidPrescriptionsForUser(userId);
        return ResponseEntity.ok(prescriptions);
    }

    // Approve prescription
    @PostMapping("/{id}/approve")
    public ResponseEntity<Prescription> approvePrescription(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String doctorNotes = (String) body.get("doctorNotes");
        String validFromStr = (String) body.get("validFrom");
        String validUntilStr = (String) body.get("validUntil");
        
        LocalDateTime validFrom = validFromStr != null ? LocalDateTime.parse(validFromStr) : null;
        LocalDateTime validUntil = validUntilStr != null ? LocalDateTime.parse(validUntilStr) : null;
        
        Prescription approved = prescriptionService.approvePrescription(id, doctorNotes, validFrom, validUntil);
        return ResponseEntity.ok(approved);
    }

    // Reject prescription
    @PostMapping("/{id}/reject")
    public ResponseEntity<Prescription> rejectPrescription(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String doctorNotes = body.get("doctorNotes");
        Prescription rejected = prescriptionService.rejectPrescription(id, doctorNotes);
        return ResponseEntity.ok(rejected);
    }

    // Add prescription items
    @PostMapping("/{id}/items")
    public ResponseEntity<List<PrescriptionItem>> addPrescriptionItems(
            @PathVariable String id,
            @RequestBody List<PrescriptionItem> items) {
        List<PrescriptionItem> savedItems = prescriptionService.addPrescriptionItems(id, items);
        return ResponseEntity.ok(savedItems);
    }

    // Get prescription items
    @GetMapping("/{id}/items")
    public ResponseEntity<List<PrescriptionItem>> getPrescriptionItems(@PathVariable String id) {
        List<PrescriptionItem> items = prescriptionService.getPrescriptionItems(id);
        return ResponseEntity.ok(items);
    }

    // Link prescription to order
    @PostMapping("/{id}/link-order")
    public ResponseEntity<Prescription> linkPrescriptionToOrder(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String orderId = body.get("orderId");
        Prescription linked = prescriptionService.linkToOrder(id, orderId);
        return ResponseEntity.ok(linked);
    }

    // Check if prescription is valid
    @GetMapping("/{id}/validate")
    public ResponseEntity<Map<String, Boolean>> validatePrescription(@PathVariable String id) {
        boolean isValid = prescriptionService.isPrescriptionValid(id);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }

    // Get prescription by order ID
    @GetMapping("/order/{orderId}")
    public ResponseEntity<Prescription> getPrescriptionByOrder(@PathVariable String orderId) {
        return prescriptionService.getPrescriptionByOrderId(orderId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Get prescription stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPrescriptionStats() {
        Map<String, Object> stats = Map.of(
            "pending", prescriptionService.countByStatus(PrescriptionStatus.PENDING),
            "approved", prescriptionService.countByStatus(PrescriptionStatus.APPROVED),
            "rejected", prescriptionService.countByStatus(PrescriptionStatus.REJECTED),
            "used", prescriptionService.countByStatus(PrescriptionStatus.USED)
        );
        return ResponseEntity.ok(stats);
    }
}
