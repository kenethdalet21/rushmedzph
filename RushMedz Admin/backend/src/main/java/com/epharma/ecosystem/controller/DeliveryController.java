package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.model.DeliveryAssignment;
import com.epharma.ecosystem.model.DeliveryAssignment.DeliveryStatus;
import com.epharma.ecosystem.model.DriverLocation;
import com.epharma.ecosystem.service.DeliveryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Delivery operations
 * Provides API endpoints for delivery tracking and management
 */
@RestController
@RequestMapping("/api/deliveries")
@CrossOrigin(origins = "*")
public class DeliveryController {

    @Autowired
    private DeliveryService deliveryService;

    // Create delivery assignment
    @PostMapping
    public ResponseEntity<DeliveryAssignment> createDeliveryAssignment(@RequestBody DeliveryAssignment assignment) {
        DeliveryAssignment created = deliveryService.createDeliveryAssignment(assignment);
        return ResponseEntity.ok(created);
    }

    // Get delivery by order ID
    @GetMapping("/order/{orderId}")
    public ResponseEntity<DeliveryAssignment> getDeliveryByOrder(@PathVariable String orderId) {
        return deliveryService.getDeliveryByOrderId(orderId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Get active deliveries for driver
    @GetMapping("/driver/{driverId}/active")
    public ResponseEntity<List<DeliveryAssignment>> getActiveDeliveriesForDriver(@PathVariable String driverId) {
        List<DeliveryAssignment> deliveries = deliveryService.getActiveDeliveriesForDriver(driverId);
        return ResponseEntity.ok(deliveries);
    }

    // Get deliveries by user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<DeliveryAssignment>> getDeliveriesByUser(@PathVariable String userId) {
        List<DeliveryAssignment> deliveries = deliveryService.getDeliveriesByUserId(userId);
        return ResponseEntity.ok(deliveries);
    }

    // Get all active deliveries
    @GetMapping("/active")
    public ResponseEntity<List<DeliveryAssignment>> getAllActiveDeliveries() {
        List<DeliveryAssignment> deliveries = deliveryService.getAllActiveDeliveries();
        return ResponseEntity.ok(deliveries);
    }

    // Accept delivery
    @PostMapping("/{id}/accept")
    public ResponseEntity<DeliveryAssignment> acceptDelivery(@PathVariable String id) {
        DeliveryAssignment accepted = deliveryService.acceptDelivery(id);
        return ResponseEntity.ok(accepted);
    }

    // Update delivery status
    @PatchMapping("/{id}/status")
    public ResponseEntity<DeliveryAssignment> updateDeliveryStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        DeliveryStatus status = DeliveryStatus.valueOf(body.get("status"));
        DeliveryAssignment updated = deliveryService.updateDeliveryStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    // Update driver location
    @PostMapping("/driver/{driverId}/location")
    public ResponseEntity<DriverLocation> updateDriverLocation(
            @PathVariable String driverId,
            @RequestBody Map<String, Double> body) {
        Double latitude = body.get("latitude");
        Double longitude = body.get("longitude");
        Double heading = body.get("heading");
        Double speed = body.get("speed");
        
        DriverLocation updated = deliveryService.updateDriverLocation(driverId, latitude, longitude, heading, speed);
        return ResponseEntity.ok(updated);
    }

    // Get driver location
    @GetMapping("/driver/{driverId}/location")
    public ResponseEntity<DriverLocation> getDriverLocation(@PathVariable String driverId) {
        return deliveryService.getDriverLocation(driverId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Set driver online status
    @PostMapping("/driver/{driverId}/online-status")
    public ResponseEntity<DriverLocation> setDriverOnlineStatus(
            @PathVariable String driverId,
            @RequestBody Map<String, Object> body) {
        Boolean isOnline = (Boolean) body.get("isOnline");
        String driverName = (String) body.get("driverName");
        
        DriverLocation updated = deliveryService.setDriverOnlineStatus(driverId, isOnline, driverName);
        return ResponseEntity.ok(updated);
    }

    // Find nearby available drivers
    @GetMapping("/drivers/nearby")
    public ResponseEntity<List<DriverLocation>> findNearbyDrivers(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "5.0") Double radiusKm) {
        List<DriverLocation> drivers = deliveryService.findNearbyAvailableDrivers(latitude, longitude, radiusKm);
        return ResponseEntity.ok(drivers);
    }

    // Get online drivers
    @GetMapping("/drivers/online")
    public ResponseEntity<List<DriverLocation>> getOnlineDrivers() {
        List<DriverLocation> drivers = deliveryService.getOnlineDrivers();
        return ResponseEntity.ok(drivers);
    }

    // Get available drivers
    @GetMapping("/drivers/available")
    public ResponseEntity<List<DriverLocation>> getAvailableDrivers() {
        List<DriverLocation> drivers = deliveryService.getAvailableDrivers();
        return ResponseEntity.ok(drivers);
    }

    // Get driver earnings
    @GetMapping("/driver/{driverId}/earnings")
    public ResponseEntity<Map<String, Object>> getDriverEarnings(
            @PathVariable String driverId,
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
        
        Double earnings = deliveryService.calculateDriverEarnings(driverId, startDate, endDate);
        long completedCount = deliveryService.countCompletedDeliveries(driverId, startDate, endDate);
        
        return ResponseEntity.ok(Map.of(
            "period", period,
            "earnings", earnings,
            "completedDeliveries", completedCount,
            "startDate", startDate.toString(),
            "endDate", endDate.toString()
        ));
    }

    // Rate delivery
    @PostMapping("/{id}/rate")
    public ResponseEntity<DeliveryAssignment> rateDelivery(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        Integer rating = (Integer) body.get("rating");
        String review = (String) body.get("review");
        
        DeliveryAssignment rated = deliveryService.rateDelivery(id, rating, review);
        return ResponseEntity.ok(rated);
    }
}
