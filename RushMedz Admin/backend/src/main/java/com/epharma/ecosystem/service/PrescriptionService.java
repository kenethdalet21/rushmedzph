package com.epharma.ecosystem.service;

import com.epharma.ecosystem.model.Prescription;
import com.epharma.ecosystem.model.Prescription.PrescriptionStatus;
import com.epharma.ecosystem.model.PrescriptionItem;
import com.epharma.ecosystem.repository.PrescriptionRepository;
import com.epharma.ecosystem.repository.PrescriptionItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing prescriptions in the ecosystem
 * Handles prescription lifecycle from upload to approval/rejection
 */
@Service
@Transactional
public class PrescriptionService {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private PrescriptionItemRepository prescriptionItemRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private RealTimeEventService realTimeEventService;

    // Create prescription
    public Prescription createPrescription(Prescription prescription) {
        prescription.setStatus(PrescriptionStatus.PENDING);
        Prescription saved = prescriptionRepository.save(prescription);
        
        // Notify doctor
        notificationService.sendPrescriptionNotification(
            prescription.getDoctorId(),
            "New Prescription Review",
            "A new prescription requires your review from " + prescription.getUserName(),
            saved.getId(),
            "PRESCRIPTION_UPLOADED"
        );
        
        // Real-time event
        realTimeEventService.broadcastPrescriptionUpdate(saved);
        
        return saved;
    }

    // Get prescription by ID
    public Optional<Prescription> getPrescriptionById(String id) {
        return prescriptionRepository.findById(id);
    }

    // Get prescriptions by user
    public List<Prescription> getPrescriptionsByUserId(String userId) {
        return prescriptionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // Get prescriptions by doctor
    public List<Prescription> getPrescriptionsByDoctorId(String doctorId) {
        return prescriptionRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId);
    }

    // Get pending prescriptions for doctor
    public List<Prescription> getPendingPrescriptionsForDoctor(String doctorId) {
        return prescriptionRepository.findPendingByDoctorId(doctorId);
    }

    // Get valid prescriptions for user
    public List<Prescription> getValidPrescriptionsForUser(String userId) {
        return prescriptionRepository.findValidByUserId(userId, LocalDateTime.now());
    }

    // Approve prescription
    public Prescription approvePrescription(String prescriptionId, String doctorNotes, 
            LocalDateTime validFrom, LocalDateTime validUntil) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
            .orElseThrow(() -> new RuntimeException("Prescription not found"));
        
        prescription.setStatus(PrescriptionStatus.APPROVED);
        prescription.setDoctorNotes(doctorNotes);
        prescription.setApprovedAt(LocalDateTime.now());
        prescription.setValidFrom(validFrom != null ? validFrom : LocalDateTime.now());
        prescription.setValidUntil(validUntil);
        
        Prescription saved = prescriptionRepository.save(prescription);
        
        // Notify user
        notificationService.sendPrescriptionNotification(
            prescription.getUserId(),
            "Prescription Approved",
            "Your prescription has been approved by Dr. " + prescription.getDoctorName(),
            saved.getId(),
            "PRESCRIPTION_APPROVED"
        );
        
        // Real-time event
        realTimeEventService.broadcastPrescriptionUpdate(saved);
        
        return saved;
    }

    // Reject prescription
    public Prescription rejectPrescription(String prescriptionId, String doctorNotes) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
            .orElseThrow(() -> new RuntimeException("Prescription not found"));
        
        prescription.setStatus(PrescriptionStatus.REJECTED);
        prescription.setDoctorNotes(doctorNotes);
        prescription.setRejectedAt(LocalDateTime.now());
        
        Prescription saved = prescriptionRepository.save(prescription);
        
        // Notify user
        notificationService.sendPrescriptionNotification(
            prescription.getUserId(),
            "Prescription Rejected",
            "Your prescription was not approved. Please check the notes from your doctor.",
            saved.getId(),
            "PRESCRIPTION_REJECTED"
        );
        
        // Real-time event
        realTimeEventService.broadcastPrescriptionUpdate(saved);
        
        return saved;
    }

    // Add prescription items
    public List<PrescriptionItem> addPrescriptionItems(String prescriptionId, List<PrescriptionItem> items) {
        for (PrescriptionItem item : items) {
            item.setPrescriptionId(prescriptionId);
        }
        return prescriptionItemRepository.saveAll(items);
    }

    // Get prescription items
    public List<PrescriptionItem> getPrescriptionItems(String prescriptionId) {
        return prescriptionItemRepository.findByPrescriptionIdOrderByCreatedAt(prescriptionId);
    }

    // Link prescription to order
    public Prescription linkToOrder(String prescriptionId, String orderId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
            .orElseThrow(() -> new RuntimeException("Prescription not found"));
        
        prescription.setLinkedOrderId(orderId);
        prescription.setStatus(PrescriptionStatus.USED);
        
        return prescriptionRepository.save(prescription);
    }

    // Check if prescription is valid for purchase
    public boolean isPrescriptionValid(String prescriptionId) {
        Optional<Prescription> prescriptionOpt = prescriptionRepository.findById(prescriptionId);
        if (prescriptionOpt.isEmpty()) {
            return false;
        }
        
        Prescription prescription = prescriptionOpt.get();
        if (prescription.getStatus() != PrescriptionStatus.APPROVED) {
            return false;
        }
        
        if (prescription.getValidUntil() != null && prescription.getValidUntil().isBefore(LocalDateTime.now())) {
            return false;
        }
        
        return true;
    }

    // Get prescription by order ID
    public Optional<Prescription> getPrescriptionByOrderId(String orderId) {
        return prescriptionRepository.findByLinkedOrderId(orderId);
    }

    // Count prescriptions by status
    public long countByStatus(PrescriptionStatus status) {
        return prescriptionRepository.countByStatus(status);
    }
}
