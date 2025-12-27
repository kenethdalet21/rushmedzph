package com.epharma.ecosystem.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class RouteOptimizationService {

    private static final String GOOGLE_MAPS_API_URL = "https://maps.googleapis.com/maps/api/directions/json";
    private static final String API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // Replace with your actual API key

    public String getOptimizedRoute(String origin, String destination) {
        RestTemplate restTemplate = new RestTemplate();
        String url = GOOGLE_MAPS_API_URL + "?origin=" + origin + "&destination=" + destination + "&key=" + API_KEY;
        return restTemplate.getForObject(url, String.class);
    }
}