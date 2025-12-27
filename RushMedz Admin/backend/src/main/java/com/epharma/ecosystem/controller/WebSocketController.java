package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

/**
 * WebSocket Controller for real-time messaging
 * Handles real-time events across the ecosystem
 */
@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Handle subscription to order updates
     */
    @MessageMapping("/orders/{orderId}/subscribe")
    public void subscribeToOrder(@DestinationVariable String orderId, Principal principal) {
        // Send confirmation
        messagingTemplate.convertAndSendToUser(
            principal.getName(),
            "/queue/subscribed",
            Map.of("type", "order", "id", orderId, "status", "subscribed")
        );
    }

    /**
     * Handle subscription to delivery updates
     */
    @MessageMapping("/deliveries/{deliveryId}/subscribe")
    public void subscribeToDelivery(@DestinationVariable String deliveryId, Principal principal) {
        messagingTemplate.convertAndSendToUser(
            principal.getName(),
            "/queue/subscribed",
            Map.of("type", "delivery", "id", deliveryId, "status", "subscribed")
        );
    }

    /**
     * Handle subscription to consultation updates
     */
    @MessageMapping("/consultations/{consultationId}/subscribe")
    public void subscribeToConsultation(@DestinationVariable String consultationId, Principal principal) {
        messagingTemplate.convertAndSendToUser(
            principal.getName(),
            "/queue/subscribed",
            Map.of("type", "consultation", "id", consultationId, "status", "subscribed")
        );
    }

    /**
     * Handle driver location update
     */
    @MessageMapping("/drivers/{driverId}/location")
    public void updateDriverLocation(
            @DestinationVariable String driverId,
            @Payload Map<String, Double> location) {
        // Broadcast to relevant subscribers
        messagingTemplate.convertAndSend(
            "/topic/drivers/" + driverId + "/location",
            location
        );
    }

    /**
     * Handle chat message in consultation
     */
    @MessageMapping("/consultations/{consultationId}/chat")
    public void handleChatMessage(
            @DestinationVariable String consultationId,
            @Payload Map<String, Object> message) {
        // Broadcast to consultation room
        messagingTemplate.convertAndSend(
            "/topic/consultations/" + consultationId + "/messages",
            message
        );
    }

    /**
     * Broadcast order update to all interested parties
     */
    public void broadcastOrderUpdate(Order order) {
        // Send to order-specific topic
        messagingTemplate.convertAndSend("/topic/orders/" + order.getId(), order);
        
        // Send to user
        messagingTemplate.convertAndSend("/topic/users/" + order.getUserId() + "/orders", order);
        
        // Send to merchant
        messagingTemplate.convertAndSend("/topic/merchants/" + order.getMerchantId() + "/orders", order);
        
        // Send to admin dashboard
        messagingTemplate.convertAndSend("/topic/admin/orders", order);
    }

    /**
     * Broadcast delivery update
     */
    public void broadcastDeliveryUpdate(DeliveryAssignment delivery) {
        messagingTemplate.convertAndSend("/topic/deliveries/" + delivery.getId(), delivery);
        messagingTemplate.convertAndSend("/topic/orders/" + delivery.getOrderId() + "/delivery", delivery);
        messagingTemplate.convertAndSend("/topic/drivers/" + delivery.getDriverId() + "/deliveries", delivery);
        messagingTemplate.convertAndSend("/topic/users/" + delivery.getUserId() + "/deliveries", delivery);
        messagingTemplate.convertAndSend("/topic/admin/deliveries", delivery);
    }

    /**
     * Broadcast driver location update
     */
    public void broadcastDriverLocation(DriverLocation location) {
        messagingTemplate.convertAndSend("/topic/drivers/" + location.getDriverId() + "/location", location);
        
        if (location.getCurrentAssignmentId() != null) {
            messagingTemplate.convertAndSend(
                "/topic/deliveries/" + location.getCurrentAssignmentId() + "/driver-location",
                location
            );
        }
    }

    /**
     * Broadcast consultation update
     */
    public void broadcastConsultationUpdate(Consultation consultation) {
        messagingTemplate.convertAndSend("/topic/consultations/" + consultation.getId(), consultation);
        messagingTemplate.convertAndSend("/topic/users/" + consultation.getUserId() + "/consultations", consultation);
        messagingTemplate.convertAndSend("/topic/doctors/" + consultation.getDoctorId() + "/consultations", consultation);
    }

    /**
     * Broadcast chat message
     */
    public void broadcastChatMessage(ChatMessage message) {
        messagingTemplate.convertAndSend(
            "/topic/consultations/" + message.getConsultationId() + "/messages",
            message
        );
    }

    /**
     * Broadcast prescription update
     */
    public void broadcastPrescriptionUpdate(Prescription prescription) {
        messagingTemplate.convertAndSend("/topic/prescriptions/" + prescription.getId(), prescription);
        messagingTemplate.convertAndSend("/topic/users/" + prescription.getUserId() + "/prescriptions", prescription);
        messagingTemplate.convertAndSend("/topic/doctors/" + prescription.getDoctorId() + "/prescriptions", prescription);
    }

    /**
     * Broadcast product update
     */
    public void broadcastProductUpdate(Product product) {
        messagingTemplate.convertAndSend("/topic/products/" + product.getId(), product);
        messagingTemplate.convertAndSend("/topic/merchants/" + product.getMerchantId() + "/products", product);
        messagingTemplate.convertAndSend("/topic/products/updates", product);
    }

    /**
     * Broadcast notification
     */
    public void broadcastNotification(Notification notification) {
        messagingTemplate.convertAndSend(
            "/topic/users/" + notification.getUserId() + "/notifications",
            notification
        );
    }

    /**
     * Send notification to specific user
     */
    public void sendToUser(String userId, String destination, Object payload) {
        messagingTemplate.convertAndSendToUser(userId, destination, payload);
    }
}
