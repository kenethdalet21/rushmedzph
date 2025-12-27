package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.DeliveryAssignment;
import com.epharma.ecosystem.model.DeliveryAssignment.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for DeliveryAssignment entity
 * Provides database operations for delivery tracking
 */
@Repository
public interface DeliveryAssignmentRepository extends JpaRepository<DeliveryAssignment, String> {

    // Find by order
    Optional<DeliveryAssignment> findByOrderId(String orderId);
    
    // Find by driver
    List<DeliveryAssignment> findByDriverIdOrderByAssignedAtDesc(String driverId);
    
    List<DeliveryAssignment> findByDriverIdAndStatus(String driverId, DeliveryStatus status);
    
    // Find active deliveries for driver
    @Query("SELECT d FROM DeliveryAssignment d WHERE d.driverId = :driverId AND d.status NOT IN ('DELIVERED', 'CANCELLED', 'FAILED') ORDER BY d.assignedAt DESC")
    List<DeliveryAssignment> findActiveByDriverId(@Param("driverId") String driverId);
    
    // Find by merchant
    List<DeliveryAssignment> findByMerchantIdOrderByAssignedAtDesc(String merchantId);
    
    // Find by user
    List<DeliveryAssignment> findByUserIdOrderByAssignedAtDesc(String userId);
    
    // Find active deliveries
    @Query("SELECT d FROM DeliveryAssignment d WHERE d.status NOT IN ('DELIVERED', 'CANCELLED', 'FAILED') ORDER BY d.assignedAt DESC")
    List<DeliveryAssignment> findAllActive();
    
    // Count by status
    long countByStatus(DeliveryStatus status);
    
    long countByDriverIdAndStatus(String driverId, DeliveryStatus status);
    
    // Driver earnings
    @Query("SELECT SUM(d.driverEarnings) FROM DeliveryAssignment d WHERE d.driverId = :driverId AND d.status = 'DELIVERED' AND d.deliveredAt BETWEEN :startDate AND :endDate")
    Double calculateDriverEarnings(@Param("driverId") String driverId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Count completed deliveries
    @Query("SELECT COUNT(d) FROM DeliveryAssignment d WHERE d.driverId = :driverId AND d.status = 'DELIVERED' AND d.deliveredAt BETWEEN :startDate AND :endDate")
    long countCompletedDeliveries(@Param("driverId") String driverId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Find deliveries needing assignment
    @Query("SELECT d FROM DeliveryAssignment d WHERE d.status = 'ASSIGNED' AND d.acceptedAt IS NULL ORDER BY d.assignedAt ASC")
    List<DeliveryAssignment> findPendingAcceptance();
}
