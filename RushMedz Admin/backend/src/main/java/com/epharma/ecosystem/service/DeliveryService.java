package com.epharma.ecosystem.service;

import com.epharma.ecosystem.model.DeliveryAssignment;
import com.epharma.ecosystem.model.DeliveryAssignment.DeliveryStatus;
import com.epharma.ecosystem.model.DriverLocation;
import com.epharma.ecosystem.model.DriverLocation.DriverStatus;
import com.epharma.ecosystem.repository.DeliveryAssignmentRepository;
import com.epharma.ecosystem.repository.DriverLocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing deliveries in the ecosystem
 * Handles delivery assignment, tracking, and completion
 */
@Service
@Transactional
public class DeliveryService {

    @Autowired
    private DeliveryAssignmentRepository deliveryAssignmentRepository;

    @Autowired
    private DriverLocationRepository driverLocationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private RealTimeEventService realTimeEventService;

    // Create delivery assignment
    public DeliveryAssignment createDeliveryAssignment(DeliveryAssignment assignment) {
        assignment.setStatus(DeliveryStatus.ASSIGNED);
        
        DeliveryAssignment saved = deliveryAssignmentRepository.save(assignment);
        
        // Notify driver
        notificationService.sendDeliveryNotification(
            assignment.getDriverId(),
            "New Delivery Assignment",
            "You have been assigned a new delivery from " + assignment.getMerchantName(),
            saved.getId(),
            "DELIVERY_ASSIGNED"
        );
        
        // Update driver status
        updateDriverStatus(assignment.getDriverId(), DriverStatus.ONLINE_BUSY, saved.getId());
        
        // Real-time event
        realTimeEventService.broadcastDeliveryUpdate(saved);
        
        return saved;
    }

    // Accept delivery
    public DeliveryAssignment acceptDelivery(String assignmentId) {
        DeliveryAssignment assignment = deliveryAssignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new RuntimeException("Delivery assignment not found"));
        
        assignment.setStatus(DeliveryStatus.ACCEPTED);
        assignment.setAcceptedAt(LocalDateTime.now());
        
        DeliveryAssignment saved = deliveryAssignmentRepository.save(assignment);
        
        // Notify merchant and user
        notificationService.sendDeliveryNotification(
            assignment.getMerchantId(),
            "Driver Accepted",
            assignment.getDriverName() + " has accepted the delivery",
            saved.getId(),
            "DELIVERY_ACCEPTED"
        );
        
        notificationService.sendDeliveryNotification(
            assignment.getUserId(),
            "Driver Assigned",
            assignment.getDriverName() + " will deliver your order",
            saved.getId(),
            "DELIVERY_ACCEPTED"
        );
        
        // Real-time event
        realTimeEventService.broadcastDeliveryUpdate(saved);
        
        return saved;
    }

    // Update delivery status
    public DeliveryAssignment updateDeliveryStatus(String assignmentId, DeliveryStatus status) {
        DeliveryAssignment assignment = deliveryAssignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new RuntimeException("Delivery assignment not found"));
        
        assignment.setStatus(status);
        
        // Update timestamps based on status
        switch (status) {
            case PICKED_UP:
                assignment.setPickedUpAt(LocalDateTime.now());
                break;
            case DELIVERED:
                assignment.setDeliveredAt(LocalDateTime.now());
                calculateActualDuration(assignment);
                break;
            case CANCELLED:
                assignment.setCancelledAt(LocalDateTime.now());
                break;
            default:
                break;
        }
        
        DeliveryAssignment saved = deliveryAssignmentRepository.save(assignment);
        
        // Send notifications based on status
        sendStatusNotifications(saved, status);
        
        // Update driver status if delivered or cancelled
        if (status == DeliveryStatus.DELIVERED || status == DeliveryStatus.CANCELLED) {
            updateDriverStatus(assignment.getDriverId(), DriverStatus.ONLINE_AVAILABLE, null);
        }
        
        // Real-time event
        realTimeEventService.broadcastDeliveryUpdate(saved);
        
        return saved;
    }

    // Update driver location
    public DriverLocation updateDriverLocation(String driverId, Double latitude, Double longitude, 
            Double heading, Double speed) {
        DriverLocation location = driverLocationRepository.findByDriverId(driverId)
            .orElseGet(() -> {
                DriverLocation newLocation = new DriverLocation();
                newLocation.setDriverId(driverId);
                return newLocation;
            });
        
        location.setLatitude(latitude);
        location.setLongitude(longitude);
        location.setHeading(heading);
        location.setSpeed(speed);
        location.setLastHeartbeat(LocalDateTime.now());
        location.setIsOnline(true);
        
        DriverLocation saved = driverLocationRepository.save(location);
        
        // If driver has active assignment, update delivery tracking
        if (location.getCurrentAssignmentId() != null) {
            updateDeliveryLocation(location.getCurrentAssignmentId(), latitude, longitude);
            realTimeEventService.broadcastDriverLocation(saved);
        }
        
        return saved;
    }

    // Update delivery location (current driver position)
    private void updateDeliveryLocation(String assignmentId, Double latitude, Double longitude) {
        deliveryAssignmentRepository.findById(assignmentId).ifPresent(assignment -> {
            assignment.setCurrentLat(latitude);
            assignment.setCurrentLng(longitude);
            deliveryAssignmentRepository.save(assignment);
        });
    }

    // Set driver online/offline
    public DriverLocation setDriverOnlineStatus(String driverId, boolean isOnline, String driverName) {
        DriverLocation location = driverLocationRepository.findByDriverId(driverId)
            .orElseGet(() -> {
                DriverLocation newLocation = new DriverLocation();
                newLocation.setDriverId(driverId);
                newLocation.setDriverName(driverName);
                newLocation.setLatitude(0.0);
                newLocation.setLongitude(0.0);
                return newLocation;
            });
        
        location.setIsOnline(isOnline);
        location.setStatus(isOnline ? DriverStatus.ONLINE_AVAILABLE : DriverStatus.OFFLINE);
        location.setLastHeartbeat(LocalDateTime.now());
        
        return driverLocationRepository.save(location);
    }

    // Update driver status
    private void updateDriverStatus(String driverId, DriverStatus status, String assignmentId) {
        driverLocationRepository.findByDriverId(driverId).ifPresent(location -> {
            location.setStatus(status);
            location.setCurrentAssignmentId(assignmentId);
            driverLocationRepository.save(location);
        });
    }

    // Calculate actual duration
    private void calculateActualDuration(DeliveryAssignment assignment) {
        if (assignment.getAcceptedAt() != null && assignment.getDeliveredAt() != null) {
            Duration duration = Duration.between(assignment.getAcceptedAt(), assignment.getDeliveredAt());
            assignment.setActualDurationMinutes((int) duration.toMinutes());
        }
    }

    // Send status notifications
    private void sendStatusNotifications(DeliveryAssignment assignment, DeliveryStatus status) {
        String title;
        String message;
        String notificationType;
        
        switch (status) {
            case EN_ROUTE_TO_PICKUP:
                title = "Driver En Route to Pickup";
                message = assignment.getDriverName() + " is on the way to pick up your order";
                notificationType = "DELIVERY_EN_ROUTE";
                break;
            case ARRIVED_AT_PICKUP:
                title = "Driver Arrived at Store";
                message = assignment.getDriverName() + " has arrived at " + assignment.getMerchantName();
                notificationType = "DELIVERY_PICKUP_ARRIVED";
                break;
            case PICKED_UP:
                title = "Order Picked Up";
                message = "Your order has been picked up and is on the way";
                notificationType = "ORDER_PICKED_UP";
                break;
            case EN_ROUTE_TO_DELIVERY:
                title = "Out for Delivery";
                message = assignment.getDriverName() + " is on the way to your location";
                notificationType = "DELIVERY_EN_ROUTE";
                break;
            case ARRIVED_AT_DELIVERY:
                title = "Driver Arrived";
                message = assignment.getDriverName() + " has arrived at your location";
                notificationType = "DELIVERY_ARRIVED";
                break;
            case DELIVERED:
                title = "Order Delivered";
                message = "Your order has been delivered successfully";
                notificationType = "DELIVERY_COMPLETED";
                break;
            case CANCELLED:
                title = "Delivery Cancelled";
                message = "The delivery has been cancelled";
                notificationType = "ORDER_CANCELLED";
                break;
            default:
                return;
        }
        
        // Notify user
        notificationService.sendDeliveryNotification(
            assignment.getUserId(),
            title,
            message,
            assignment.getId(),
            notificationType
        );
    }

    // Find nearby available drivers
    public List<DriverLocation> findNearbyAvailableDrivers(Double latitude, Double longitude, Double radiusKm) {
        return driverLocationRepository.findNearbyAvailable(latitude, longitude, radiusKm);
    }

    // Get delivery by order ID
    public Optional<DeliveryAssignment> getDeliveryByOrderId(String orderId) {
        return deliveryAssignmentRepository.findByOrderId(orderId);
    }

    // Get active deliveries for driver
    public List<DeliveryAssignment> getActiveDeliveriesForDriver(String driverId) {
        return deliveryAssignmentRepository.findActiveByDriverId(driverId);
    }

    // Get deliveries by user
    public List<DeliveryAssignment> getDeliveriesByUserId(String userId) {
        return deliveryAssignmentRepository.findByUserIdOrderByAssignedAtDesc(userId);
    }

    // Get all active deliveries
    public List<DeliveryAssignment> getAllActiveDeliveries() {
        return deliveryAssignmentRepository.findAllActive();
    }

    // Get driver location
    public Optional<DriverLocation> getDriverLocation(String driverId) {
        return driverLocationRepository.findByDriverId(driverId);
    }

    // Get online drivers
    public List<DriverLocation> getOnlineDrivers() {
        return driverLocationRepository.findByIsOnlineTrue();
    }

    // Get available drivers
    public List<DriverLocation> getAvailableDrivers() {
        return driverLocationRepository.findAvailableDrivers();
    }

    // Calculate driver earnings
    public Double calculateDriverEarnings(String driverId, LocalDateTime startDate, LocalDateTime endDate) {
        Double earnings = deliveryAssignmentRepository.calculateDriverEarnings(driverId, startDate, endDate);
        return earnings != null ? earnings : 0.0;
    }

    // Count completed deliveries
    public long countCompletedDeliveries(String driverId, LocalDateTime startDate, LocalDateTime endDate) {
        return deliveryAssignmentRepository.countCompletedDeliveries(driverId, startDate, endDate);
    }

    // Rate delivery
    public DeliveryAssignment rateDelivery(String assignmentId, Integer rating, String review) {
        DeliveryAssignment assignment = deliveryAssignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new RuntimeException("Delivery assignment not found"));
        
        assignment.setRating(rating);
        assignment.setReview(review);
        
        return deliveryAssignmentRepository.save(assignment);
    }
}
