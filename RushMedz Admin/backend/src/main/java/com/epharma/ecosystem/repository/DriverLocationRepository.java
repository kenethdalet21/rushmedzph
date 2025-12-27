package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.DriverLocation;
import com.epharma.ecosystem.model.DriverLocation.DriverStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for DriverLocation entity
 * Provides database operations for real-time driver tracking
 */
@Repository
public interface DriverLocationRepository extends JpaRepository<DriverLocation, String> {

    // Find by driver
    Optional<DriverLocation> findByDriverId(String driverId);
    
    // Find online drivers
    List<DriverLocation> findByIsOnlineTrue();
    
    // Find available drivers
    @Query("SELECT d FROM DriverLocation d WHERE d.isOnline = true AND d.status = 'ONLINE_AVAILABLE'")
    List<DriverLocation> findAvailableDrivers();
    
    // Find drivers by status
    List<DriverLocation> findByStatus(DriverStatus status);
    
    // Find drivers near location
    @Query("SELECT d FROM DriverLocation d WHERE d.isOnline = true AND d.status = 'ONLINE_AVAILABLE' " +
           "AND (6371 * acos(cos(radians(:lat)) * cos(radians(d.latitude)) * cos(radians(d.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(d.latitude)))) < :radiusKm " +
           "ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(d.latitude)) * cos(radians(d.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(d.latitude)))) ASC")
    List<DriverLocation> findNearbyAvailable(@Param("lat") Double lat, @Param("lng") Double lng, @Param("radiusKm") Double radiusKm);
    
    // Find by assignment
    Optional<DriverLocation> findByCurrentAssignmentId(String currentAssignmentId);
    
    // Find stale locations (for cleanup)
    @Query("SELECT d FROM DriverLocation d WHERE d.isOnline = true AND d.lastHeartbeat < :threshold")
    List<DriverLocation> findStaleLocations(@Param("threshold") LocalDateTime threshold);
    
    // Count online drivers
    long countByIsOnlineTrue();
    
    // Count available drivers
    @Query("SELECT COUNT(d) FROM DriverLocation d WHERE d.isOnline = true AND d.status = 'ONLINE_AVAILABLE'")
    long countAvailable();
}
