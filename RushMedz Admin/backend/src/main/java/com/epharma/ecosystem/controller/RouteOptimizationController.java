package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.service.RouteOptimizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/route")
public class RouteOptimizationController {

    @Autowired
    private RouteOptimizationService routeOptimizationService;

    @GetMapping("/optimize")
    public ResponseEntity<?> getOptimizedRoute(@RequestParam String origin, @RequestParam String destination) {
        try {
            String route = routeOptimizationService.getOptimizedRoute(origin, destination);
            return ResponseEntity.ok(route);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error optimizing route: " + e.getMessage());
        }
    }
}