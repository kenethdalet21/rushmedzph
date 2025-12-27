package com.epharma.ecosystem.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * DriverLocation entity - Tracks real-time driver location for delivery tracking
 * Enables live location updates visible to users, merchants, and admin
 */
@Entity
@Table(name = "driver_locations", indexes = {
    @Index(name = "idx_driver_location_driver", columnList = "driver_id"),
    @Index(name = "idx_driver_location_assignment", columnList = "current_assignment_id"),
    @Index(name = "idx_driver_location_updated", columnList = "updated_at")
})
public class DriverLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull(message = "Driver ID is required")
    @Column(name = "driver_id", nullable = false, unique = true)
    private String driverId;

    @Column(name = "driver_name")
    private String driverName;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "heading")
    private Double heading;

    @Column(name = "speed")
    private Double speed;

    @Column(name = "accuracy")
    private Double accuracy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private DriverStatus status = DriverStatus.OFFLINE;

    @Column(name = "current_assignment_id")
    private String currentAssignmentId;

    @Column(name = "is_online")
    private Boolean isOnline = false;

    @Column(name = "battery_level")
    private Integer batteryLevel;

    @Column(name = "last_heartbeat")
    private LocalDateTime lastHeartbeat;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum DriverStatus {
        OFFLINE,
        ONLINE_AVAILABLE,
        ONLINE_BUSY,
        EN_ROUTE_TO_PICKUP,
        AT_PICKUP,
        EN_ROUTE_TO_DELIVERY,
        AT_DELIVERY,
        BREAK
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public DriverLocation() {}

    public DriverLocation(String driverId, Double latitude, Double longitude) {
        this.driverId = driverId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = DriverStatus.ONLINE_AVAILABLE;
        this.isOnline = true;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDriverId() { return driverId; }
    public void setDriverId(String driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getHeading() { return heading; }
    public void setHeading(Double heading) { this.heading = heading; }

    public Double getSpeed() { return speed; }
    public void setSpeed(Double speed) { this.speed = speed; }

    public Double getAccuracy() { return accuracy; }
    public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }

    public DriverStatus getStatus() { return status; }
    public void setStatus(DriverStatus status) { this.status = status; }

    public String getCurrentAssignmentId() { return currentAssignmentId; }
    public void setCurrentAssignmentId(String currentAssignmentId) { this.currentAssignmentId = currentAssignmentId; }

    public Boolean getIsOnline() { return isOnline; }
    public void setIsOnline(Boolean isOnline) { this.isOnline = isOnline; }

    public Integer getBatteryLevel() { return batteryLevel; }
    public void setBatteryLevel(Integer batteryLevel) { this.batteryLevel = batteryLevel; }

    public LocalDateTime getLastHeartbeat() { return lastHeartbeat; }
    public void setLastHeartbeat(LocalDateTime lastHeartbeat) { this.lastHeartbeat = lastHeartbeat; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
