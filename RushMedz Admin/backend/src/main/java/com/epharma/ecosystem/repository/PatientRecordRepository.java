package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.PatientRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PatientRecord entity
 * Provides database operations for patient medical records
 */
@Repository
public interface PatientRecordRepository extends JpaRepository<PatientRecord, String> {

    // Find by user ID
    Optional<PatientRecord> findByUserId(String userId);
    
    // Find by primary doctor
    List<PatientRecord> findByPrimaryDoctorIdOrderByUserName(String primaryDoctorId);
    
    // Search by name
    @Query("SELECT p FROM PatientRecord p WHERE LOWER(p.userName) LIKE LOWER(CONCAT('%', :name, '%')) ORDER BY p.userName")
    List<PatientRecord> searchByName(@Param("name") String name);
    
    // Search by email or phone
    @Query("SELECT p FROM PatientRecord p WHERE p.userEmail = :email OR p.userPhone = :phone")
    List<PatientRecord> findByEmailOrPhone(@Param("email") String email, @Param("phone") String phone);
    
    // Check if record exists for user
    boolean existsByUserId(String userId);
}
