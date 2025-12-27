package com.epharma.ecosystem.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class DeliveryStatusService {

    private final Map<String, String> deliveryStatusMap = new HashMap<>();

    public void updateStatus(Map<String, String> statusUpdate) {
        String orderId = statusUpdate.get("orderId");
        String status = statusUpdate.get("status");
        if (orderId != null && status != null) {
            deliveryStatusMap.put(orderId, status);
        } else {
            throw new IllegalArgumentException("Invalid status update payload.");
        }
    }

    public String getStatus(String orderId) {
        return deliveryStatusMap.getOrDefault(orderId, "Status not found.");
    }
}