package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.Consultation;
import com.epharma.ecosystem.model.Consultation.ConsultationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for Consultation entity
 * Provides database operations for telemedicine consultations
 */
@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, String> {

    // Find by user
    List<Consultation> findByUserIdOrderByCreatedAtDesc(String userId);
    
    List<Consultation> findByUserIdAndStatus(String userId, ConsultationStatus status);
    
    // Find by doctor
    List<Consultation> findByDoctorIdOrderByCreatedAtDesc(String doctorId);
    
    List<Consultation> findByDoctorIdAndStatus(String doctorId, ConsultationStatus status);
    
    // Find pending/scheduled for doctor
    @Query("SELECT c FROM Consultation c WHERE c.doctorId = :doctorId AND c.status IN ('PENDING', 'SCHEDULED', 'ACCEPTED') ORDER BY c.scheduledAt ASC NULLS LAST, c.createdAt DESC")
    List<Consultation> findUpcomingByDoctorId(@Param("doctorId") String doctorId);
    
    // Find active consultations
    @Query("SELECT c FROM Consultation c WHERE c.status = 'IN_PROGRESS' ORDER BY c.startedAt DESC")
    List<Consultation> findActiveConsultations();
    
    // Find by prescription
    List<Consultation> findByPrescriptionId(String prescriptionId);
    
    // Find by room ID
    Consultation findByRoomId(String roomId);
    
    // Count by status
    long countByStatus(ConsultationStatus status);
    
    long countByDoctorIdAndStatus(String doctorId, ConsultationStatus status);
    
    // Find consultations in date range
    @Query("SELECT c FROM Consultation c WHERE c.scheduledAt BETWEEN :startDate AND :endDate ORDER BY c.scheduledAt ASC")
    List<Consultation> findScheduledInRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Find today's consultations for doctor
    @Query("SELECT c FROM Consultation c WHERE c.doctorId = :doctorId AND DATE(c.scheduledAt) = CURRENT_DATE ORDER BY c.scheduledAt ASC")
    List<Consultation> findTodaysConsultationsByDoctorId(@Param("doctorId") String doctorId);
    
    // Doctor earnings query
    @Query("SELECT SUM(c.consultationFee) FROM Consultation c WHERE c.doctorId = :doctorId AND c.status = 'COMPLETED' AND c.endedAt BETWEEN :startDate AND :endDate")
    Double calculateDoctorEarnings(@Param("doctorId") String doctorId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
