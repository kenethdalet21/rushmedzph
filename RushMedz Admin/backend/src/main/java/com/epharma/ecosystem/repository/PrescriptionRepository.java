package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.Prescription;
import com.epharma.ecosystem.model.Prescription.PrescriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Prescription entity
 * Provides database operations for prescriptions across the ecosystem
 */
@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, String> {

    // Find by user
    List<Prescription> findByUserIdOrderByCreatedAtDesc(String userId);
    
    List<Prescription> findByUserIdAndStatus(String userId, PrescriptionStatus status);
    
    // Find by doctor
    List<Prescription> findByDoctorIdOrderByCreatedAtDesc(String doctorId);
    
    List<Prescription> findByDoctorIdAndStatus(String doctorId, PrescriptionStatus status);
    
    // Find pending prescriptions for doctors
    @Query("SELECT p FROM Prescription p WHERE p.doctorId = :doctorId AND p.status IN ('PENDING', 'UNDER_REVIEW') ORDER BY p.createdAt DESC")
    List<Prescription> findPendingByDoctorId(@Param("doctorId") String doctorId);
    
    // Find valid prescriptions for user
    @Query("SELECT p FROM Prescription p WHERE p.userId = :userId AND p.status = 'APPROVED' AND (p.validUntil IS NULL OR p.validUntil > :now) ORDER BY p.createdAt DESC")
    List<Prescription> findValidByUserId(@Param("userId") String userId, @Param("now") LocalDateTime now);
    
    // Find prescription by linked order
    Optional<Prescription> findByLinkedOrderId(String linkedOrderId);
    
    // Count by status for analytics
    long countByStatus(PrescriptionStatus status);
    
    long countByDoctorIdAndStatus(String doctorId, PrescriptionStatus status);
    
    // Find prescriptions created in date range
    @Query("SELECT p FROM Prescription p WHERE p.createdAt BETWEEN :startDate AND :endDate ORDER BY p.createdAt DESC")
    List<Prescription> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Find expiring prescriptions
    @Query("SELECT p FROM Prescription p WHERE p.status = 'APPROVED' AND p.validUntil BETWEEN :now AND :expiryThreshold")
    List<Prescription> findExpiringPrescriptions(@Param("now") LocalDateTime now, @Param("expiryThreshold") LocalDateTime expiryThreshold);
}
