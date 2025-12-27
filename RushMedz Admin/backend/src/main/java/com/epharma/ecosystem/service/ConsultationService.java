package com.epharma.ecosystem.service;

import com.epharma.ecosystem.model.Consultation;
import com.epharma.ecosystem.model.Consultation.ConsultationStatus;
import com.epharma.ecosystem.model.ChatMessage;
import com.epharma.ecosystem.model.ChatMessage.SenderType;
import com.epharma.ecosystem.model.ChatMessage.MessageType;
import com.epharma.ecosystem.repository.ConsultationRepository;
import com.epharma.ecosystem.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing telemedicine consultations
 * Handles consultation lifecycle and real-time chat
 */
@Service
@Transactional
public class ConsultationService {

    @Autowired
    private ConsultationRepository consultationRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private RealTimeEventService realTimeEventService;

    // Request consultation
    public Consultation requestConsultation(Consultation consultation) {
        consultation.setStatus(ConsultationStatus.PENDING);
        consultation.setRoomId(UUID.randomUUID().toString());
        
        Consultation saved = consultationRepository.save(consultation);
        
        // Notify doctor
        notificationService.sendConsultationNotification(
            consultation.getDoctorId(),
            "New Consultation Request",
            consultation.getUserName() + " is requesting a " + consultation.getConsultationType() + " consultation",
            saved.getId(),
            "CONSULTATION_REQUESTED"
        );
        
        // Real-time event
        realTimeEventService.broadcastConsultationUpdate(saved);
        
        return saved;
    }

    // Accept consultation
    public Consultation acceptConsultation(String consultationId) {
        Consultation consultation = consultationRepository.findById(consultationId)
            .orElseThrow(() -> new RuntimeException("Consultation not found"));
        
        consultation.setStatus(ConsultationStatus.ACCEPTED);
        
        Consultation saved = consultationRepository.save(consultation);
        
        // Notify user
        notificationService.sendConsultationNotification(
            consultation.getUserId(),
            "Consultation Accepted",
            "Dr. " + consultation.getDoctorName() + " has accepted your consultation request",
            saved.getId(),
            "CONSULTATION_SCHEDULED"
        );
        
        // Real-time event
        realTimeEventService.broadcastConsultationUpdate(saved);
        
        return saved;
    }

    // Start consultation
    public Consultation startConsultation(String consultationId) {
        Consultation consultation = consultationRepository.findById(consultationId)
            .orElseThrow(() -> new RuntimeException("Consultation not found"));
        
        consultation.setStatus(ConsultationStatus.IN_PROGRESS);
        consultation.setStartedAt(LocalDateTime.now());
        
        Consultation saved = consultationRepository.save(consultation);
        
        // Notify user
        notificationService.sendConsultationNotification(
            consultation.getUserId(),
            "Consultation Started",
            "Your consultation with Dr. " + consultation.getDoctorName() + " has started",
            saved.getId(),
            "CONSULTATION_STARTED"
        );
        
        // Real-time event
        realTimeEventService.broadcastConsultationUpdate(saved);
        
        return saved;
    }

    // End consultation
    public Consultation endConsultation(String consultationId, String diagnosis, 
            String treatmentPlan, String followUpNotes) {
        Consultation consultation = consultationRepository.findById(consultationId)
            .orElseThrow(() -> new RuntimeException("Consultation not found"));
        
        consultation.setStatus(ConsultationStatus.COMPLETED);
        consultation.setEndedAt(LocalDateTime.now());
        consultation.setDiagnosis(diagnosis);
        consultation.setTreatmentPlan(treatmentPlan);
        consultation.setFollowUpNotes(followUpNotes);
        
        // Calculate duration
        if (consultation.getStartedAt() != null) {
            Duration duration = Duration.between(consultation.getStartedAt(), consultation.getEndedAt());
            consultation.setDurationMinutes((int) duration.toMinutes());
        }
        
        Consultation saved = consultationRepository.save(consultation);
        
        // Notify user
        notificationService.sendConsultationNotification(
            consultation.getUserId(),
            "Consultation Completed",
            "Your consultation with Dr. " + consultation.getDoctorName() + " has been completed",
            saved.getId(),
            "CONSULTATION_ENDED"
        );
        
        // Real-time event
        realTimeEventService.broadcastConsultationUpdate(saved);
        
        return saved;
    }

    // Cancel consultation
    public Consultation cancelConsultation(String consultationId, String cancelledBy, String reason) {
        Consultation consultation = consultationRepository.findById(consultationId)
            .orElseThrow(() -> new RuntimeException("Consultation not found"));
        
        consultation.setStatus(ConsultationStatus.CANCELLED);
        consultation.setConsultationNotes("Cancelled by " + cancelledBy + ": " + reason);
        
        Consultation saved = consultationRepository.save(consultation);
        
        // Notify the other party
        String notifyUserId = cancelledBy.equals("doctor") ? consultation.getUserId() : consultation.getDoctorId();
        notificationService.sendConsultationNotification(
            notifyUserId,
            "Consultation Cancelled",
            "The consultation has been cancelled: " + reason,
            saved.getId(),
            "CONSULTATION_CANCELLED"
        );
        
        // Real-time event
        realTimeEventService.broadcastConsultationUpdate(saved);
        
        return saved;
    }

    // Send chat message
    public ChatMessage sendMessage(String consultationId, String senderId, SenderType senderType,
            String senderName, String content, MessageType messageType) {
        ChatMessage message = new ChatMessage();
        message.setConsultationId(consultationId);
        message.setSenderId(senderId);
        message.setSenderType(senderType);
        message.setSenderName(senderName);
        message.setContent(content);
        message.setMessageType(messageType);
        
        ChatMessage saved = chatMessageRepository.save(message);
        
        // Real-time broadcast
        realTimeEventService.broadcastChatMessage(saved);
        
        return saved;
    }

    // Get chat messages
    public List<ChatMessage> getChatMessages(String consultationId) {
        return chatMessageRepository.findByConsultationIdOrderByCreatedAtAsc(consultationId);
    }

    // Mark messages as read
    public int markMessagesAsRead(String consultationId, String receiverId) {
        return chatMessageRepository.markAsRead(consultationId, receiverId, LocalDateTime.now());
    }

    // Get consultation by ID
    public Optional<Consultation> getConsultationById(String id) {
        return consultationRepository.findById(id);
    }

    // Get consultations by user
    public List<Consultation> getConsultationsByUserId(String userId) {
        return consultationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // Get consultations by doctor
    public List<Consultation> getConsultationsByDoctorId(String doctorId) {
        return consultationRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId);
    }

    // Get upcoming consultations for doctor
    public List<Consultation> getUpcomingConsultationsForDoctor(String doctorId) {
        return consultationRepository.findUpcomingByDoctorId(doctorId);
    }

    // Get active consultations
    public List<Consultation> getActiveConsultations() {
        return consultationRepository.findActiveConsultations();
    }

    // Rate consultation
    public Consultation rateConsultation(String consultationId, Integer rating, String review) {
        Consultation consultation = consultationRepository.findById(consultationId)
            .orElseThrow(() -> new RuntimeException("Consultation not found"));
        
        consultation.setRating(rating);
        consultation.setReview(review);
        
        return consultationRepository.save(consultation);
    }

    // Calculate doctor earnings
    public Double calculateDoctorEarnings(String doctorId, LocalDateTime startDate, LocalDateTime endDate) {
        Double earnings = consultationRepository.calculateDoctorEarnings(doctorId, startDate, endDate);
        return earnings != null ? earnings : 0.0;
    }

    // Count consultations by status
    public long countByStatus(ConsultationStatus status) {
        return consultationRepository.countByStatus(status);
    }
}
