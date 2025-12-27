package com.epharma.ecosystem.service;

import com.epharma.ecosystem.model.*;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.function.Consumer;

/**
 * Service for real-time event broadcasting across the ecosystem
 * Enables WebSocket-based real-time updates to all connected apps
 */
@Service
public class RealTimeEventService {

    // Event subscribers by type
    private final Map<String, Set<Consumer<Object>>> subscribers = new ConcurrentHashMap<>();
    
    // Topic-based subscribers (e.g., "order:123", "delivery:456")
    private final Map<String, Set<Consumer<Object>>> topicSubscribers = new ConcurrentHashMap<>();

    /**
     * Subscribe to a specific event type
     */
    public void subscribe(String eventType, Consumer<Object> callback) {
        subscribers.computeIfAbsent(eventType, k -> new CopyOnWriteArraySet<>()).add(callback);
    }

    /**
     * Unsubscribe from an event type
     */
    public void unsubscribe(String eventType, Consumer<Object> callback) {
        Set<Consumer<Object>> handlers = subscribers.get(eventType);
        if (handlers != null) {
            handlers.remove(callback);
        }
    }

    /**
     * Subscribe to a specific topic
     */
    public void subscribeToTopic(String topic, Consumer<Object> callback) {
        topicSubscribers.computeIfAbsent(topic, k -> new CopyOnWriteArraySet<>()).add(callback);
    }

    /**
     * Unsubscribe from a topic
     */
    public void unsubscribeFromTopic(String topic, Consumer<Object> callback) {
        Set<Consumer<Object>> handlers = topicSubscribers.get(topic);
        if (handlers != null) {
            handlers.remove(callback);
        }
    }

    /**
     * Broadcast event to all subscribers
     */
    private void broadcast(String eventType, Object data) {
        Set<Consumer<Object>> handlers = subscribers.get(eventType);
        if (handlers != null) {
            for (Consumer<Object> handler : handlers) {
                try {
                    handler.accept(data);
                } catch (Exception e) {
                    System.err.println("Error broadcasting event: " + e.getMessage());
                }
            }
        }
    }

    /**
     * Broadcast event to topic subscribers
     */
    private void broadcastToTopic(String topic, Object data) {
        Set<Consumer<Object>> handlers = topicSubscribers.get(topic);
        if (handlers != null) {
            for (Consumer<Object> handler : handlers) {
                try {
                    handler.accept(data);
                } catch (Exception e) {
                    System.err.println("Error broadcasting to topic: " + e.getMessage());
                }
            }
        }
    }

    // ==================== Order Events ====================

    public void broadcastOrderCreated(Order order) {
        broadcast("order:created", order);
        broadcastToTopic("merchant:" + order.getMerchantId(), Map.of("type", "ORDER_CREATED", "data", order));
    }

    public void broadcastOrderStatusChanged(Order order) {
        broadcast("order:status_changed", order);
        broadcastToTopic("order:" + order.getId(), Map.of("type", "ORDER_STATUS_CHANGED", "data", order));
        broadcastToTopic("user:" + order.getUserId(), Map.of("type", "ORDER_UPDATE", "data", order));
        broadcastToTopic("merchant:" + order.getMerchantId(), Map.of("type", "ORDER_UPDATE", "data", order));
    }

    // ==================== Delivery Events ====================

    public void broadcastDeliveryUpdate(DeliveryAssignment delivery) {
        broadcast("delivery:update", delivery);
        broadcastToTopic("delivery:" + delivery.getId(), Map.of("type", "DELIVERY_UPDATE", "data", delivery));
        broadcastToTopic("order:" + delivery.getOrderId(), Map.of("type", "DELIVERY_UPDATE", "data", delivery));
        broadcastToTopic("user:" + delivery.getUserId(), Map.of("type", "DELIVERY_UPDATE", "data", delivery));
        broadcastToTopic("driver:" + delivery.getDriverId(), Map.of("type", "DELIVERY_UPDATE", "data", delivery));
        broadcastToTopic("merchant:" + delivery.getMerchantId(), Map.of("type", "DELIVERY_UPDATE", "data", delivery));
    }

    public void broadcastDriverLocation(DriverLocation location) {
        broadcast("driver:location", location);
        if (location.getCurrentAssignmentId() != null) {
            broadcastToTopic("delivery:" + location.getCurrentAssignmentId(), 
                Map.of("type", "DRIVER_LOCATION", "data", location));
        }
        broadcastToTopic("driver:" + location.getDriverId(), Map.of("type", "LOCATION_UPDATE", "data", location));
    }

    // ==================== Prescription Events ====================

    public void broadcastPrescriptionUpdate(Prescription prescription) {
        broadcast("prescription:update", prescription);
        broadcastToTopic("prescription:" + prescription.getId(), Map.of("type", "PRESCRIPTION_UPDATE", "data", prescription));
        broadcastToTopic("user:" + prescription.getUserId(), Map.of("type", "PRESCRIPTION_UPDATE", "data", prescription));
        broadcastToTopic("doctor:" + prescription.getDoctorId(), Map.of("type", "PRESCRIPTION_UPDATE", "data", prescription));
    }

    // ==================== Consultation Events ====================

    public void broadcastConsultationUpdate(Consultation consultation) {
        broadcast("consultation:update", consultation);
        broadcastToTopic("consultation:" + consultation.getId(), Map.of("type", "CONSULTATION_UPDATE", "data", consultation));
        broadcastToTopic("user:" + consultation.getUserId(), Map.of("type", "CONSULTATION_UPDATE", "data", consultation));
        broadcastToTopic("doctor:" + consultation.getDoctorId(), Map.of("type", "CONSULTATION_UPDATE", "data", consultation));
    }

    public void broadcastChatMessage(ChatMessage message) {
        broadcast("chat:message", message);
        broadcastToTopic("consultation:" + message.getConsultationId(), Map.of("type", "CHAT_MESSAGE", "data", message));
    }

    // ==================== Product Events ====================

    public void broadcastProductCreated(Product product) {
        broadcast("product:created", product);
        broadcastToTopic("merchant:" + product.getMerchantId(), Map.of("type", "PRODUCT_CREATED", "data", product));
        // Broadcast to all users for browse updates
        broadcast("products:updated", product);
    }

    public void broadcastProductUpdated(Product product) {
        broadcast("product:updated", product);
        broadcastToTopic("product:" + product.getId(), Map.of("type", "PRODUCT_UPDATED", "data", product));
        broadcastToTopic("merchant:" + product.getMerchantId(), Map.of("type", "PRODUCT_UPDATED", "data", product));
        // Broadcast to all users for browse updates
        broadcast("products:updated", product);
    }

    public void broadcastProductDeleted(String productId, String merchantId) {
        broadcast("product:deleted", Map.of("productId", productId, "merchantId", merchantId));
        broadcastToTopic("merchant:" + merchantId, Map.of("type", "PRODUCT_DELETED", "data", Map.of("productId", productId)));
        // Broadcast to all users for browse updates
        broadcast("products:updated", Map.of("productId", productId, "deleted", true));
    }

    // ==================== Notification Events ====================

    public void broadcastNotification(Notification notification) {
        broadcast("notification:new", notification);
        broadcastToTopic("user:" + notification.getUserId(), Map.of("type", "NOTIFICATION", "data", notification));
    }

    // ==================== Payment Events ====================

    public void broadcastPaymentUpdate(PaymentTransaction payment) {
        broadcast("payment:update", payment);
        broadcastToTopic("order:" + payment.getOrderId(), Map.of("type", "PAYMENT_UPDATE", "data", payment));
        broadcastToTopic("user:" + payment.getUserId(), Map.of("type", "PAYMENT_UPDATE", "data", payment));
        broadcastToTopic("merchant:" + payment.getMerchantId(), Map.of("type", "PAYMENT_UPDATE", "data", payment));
    }

    // ==================== Admin Events ====================

    public void broadcastAdminEvent(String eventType, Object data) {
        broadcast("admin:" + eventType, data);
        broadcastToTopic("admin:dashboard", Map.of("type", eventType, "data", data));
    }
}
