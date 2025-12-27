package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.model.Consultation;
import com.epharma.ecosystem.model.Consultation.ConsultationStatus;
import com.epharma.ecosystem.model.ChatMessage;
import com.epharma.ecosystem.model.ChatMessage.SenderType;
import com.epharma.ecosystem.model.ChatMessage.MessageType;
import com.epharma.ecosystem.service.ConsultationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Consultation operations
 * Provides API endpoints for telemedicine consultations
 */
@RestController
@RequestMapping("/api/consultations")
@CrossOrigin(origins = "*")
public class ConsultationController {

    @Autowired
    private ConsultationService consultationService;

    // Request consultation
    @PostMapping
    public ResponseEntity<Consultation> requestConsultation(@RequestBody Consultation consultation) {
        Consultation created = consultationService.requestConsultation(consultation);
        return ResponseEntity.ok(created);
    }

    // Get consultation by ID
    @GetMapping("/{id}")
    public ResponseEntity<Consultation> getConsultationById(@PathVariable String id) {
        return consultationService.getConsultationById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Get consultations by user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Consultation>> getConsultationsByUser(@PathVariable String userId) {
        List<Consultation> consultations = consultationService.getConsultationsByUserId(userId);
        return ResponseEntity.ok(consultations);
    }

    // Get consultations by doctor
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Consultation>> getConsultationsByDoctor(@PathVariable String doctorId) {
        List<Consultation> consultations = consultationService.getConsultationsByDoctorId(doctorId);
        return ResponseEntity.ok(consultations);
    }

    // Get upcoming consultations for doctor
    @GetMapping("/doctor/{doctorId}/upcoming")
    public ResponseEntity<List<Consultation>> getUpcomingConsultationsForDoctor(@PathVariable String doctorId) {
        List<Consultation> consultations = consultationService.getUpcomingConsultationsForDoctor(doctorId);
        return ResponseEntity.ok(consultations);
    }

    // Get active consultations
    @GetMapping("/active")
    public ResponseEntity<List<Consultation>> getActiveConsultations() {
        List<Consultation> consultations = consultationService.getActiveConsultations();
        return ResponseEntity.ok(consultations);
    }

    // Accept consultation
    @PostMapping("/{id}/accept")
    public ResponseEntity<Consultation> acceptConsultation(@PathVariable String id) {
        Consultation accepted = consultationService.acceptConsultation(id);
        return ResponseEntity.ok(accepted);
    }

    // Start consultation
    @PostMapping("/{id}/start")
    public ResponseEntity<Consultation> startConsultation(@PathVariable String id) {
        Consultation started = consultationService.startConsultation(id);
        return ResponseEntity.ok(started);
    }

    // End consultation
    @PostMapping("/{id}/end")
    public ResponseEntity<Consultation> endConsultation(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String diagnosis = body.get("diagnosis");
        String treatmentPlan = body.get("treatmentPlan");
        String followUpNotes = body.get("followUpNotes");
        
        Consultation ended = consultationService.endConsultation(id, diagnosis, treatmentPlan, followUpNotes);
        return ResponseEntity.ok(ended);
    }

    // Cancel consultation
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Consultation> cancelConsultation(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String cancelledBy = body.get("cancelledBy");
        String reason = body.get("reason");
        
        Consultation cancelled = consultationService.cancelConsultation(id, cancelledBy, reason);
        return ResponseEntity.ok(cancelled);
    }

    // Send chat message
    @PostMapping("/{id}/messages")
    public ResponseEntity<ChatMessage> sendMessage(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String senderId = body.get("senderId");
        SenderType senderType = SenderType.valueOf(body.get("senderType"));
        String senderName = body.get("senderName");
        String content = body.get("content");
        MessageType messageType = body.containsKey("messageType") 
            ? MessageType.valueOf(body.get("messageType")) 
            : MessageType.TEXT;
        
        ChatMessage message = consultationService.sendMessage(id, senderId, senderType, senderName, content, messageType);
        return ResponseEntity.ok(message);
    }

    // Get chat messages
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<ChatMessage>> getChatMessages(@PathVariable String id) {
        List<ChatMessage> messages = consultationService.getChatMessages(id);
        return ResponseEntity.ok(messages);
    }

    // Mark messages as read
    @PostMapping("/{id}/messages/read")
    public ResponseEntity<Map<String, Integer>> markMessagesAsRead(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String receiverId = body.get("receiverId");
        int count = consultationService.markMessagesAsRead(id, receiverId);
        return ResponseEntity.ok(Map.of("markedAsRead", count));
    }

    // Rate consultation
    @PostMapping("/{id}/rate")
    public ResponseEntity<Consultation> rateConsultation(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        Integer rating = (Integer) body.get("rating");
        String review = (String) body.get("review");
        
        Consultation rated = consultationService.rateConsultation(id, rating, review);
        return ResponseEntity.ok(rated);
    }

    // Get doctor earnings
    @GetMapping("/doctor/{doctorId}/earnings")
    public ResponseEntity<Map<String, Object>> getDoctorEarnings(
            @PathVariable String doctorId,
            @RequestParam(defaultValue = "month") String period) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate;
        
        switch (period) {
            case "today":
                startDate = endDate.toLocalDate().atStartOfDay();
                break;
            case "week":
                startDate = endDate.minusDays(7);
                break;
            case "month":
            default:
                startDate = endDate.minusMonths(1);
                break;
        }
        
        Double earnings = consultationService.calculateDoctorEarnings(doctorId, startDate, endDate);
        
        return ResponseEntity.ok(Map.of(
            "period", period,
            "earnings", earnings,
            "startDate", startDate.toString(),
            "endDate", endDate.toString()
        ));
    }

    // Get consultation stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getConsultationStats() {
        Map<String, Object> stats = Map.of(
            "pending", consultationService.countByStatus(ConsultationStatus.PENDING),
            "active", consultationService.countByStatus(ConsultationStatus.IN_PROGRESS),
            "completed", consultationService.countByStatus(ConsultationStatus.COMPLETED),
            "cancelled", consultationService.countByStatus(ConsultationStatus.CANCELLED)
        );
        return ResponseEntity.ok(stats);
    }
}
