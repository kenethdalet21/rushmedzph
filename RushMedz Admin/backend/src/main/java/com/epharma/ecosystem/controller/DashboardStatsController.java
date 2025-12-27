package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.repository.adminapp.AdminUserRepository;
import com.epharma.ecosystem.repository.doctorapp.DoctorUserRepository;
import com.epharma.ecosystem.repository.driverapp.DriverUserRepository;
import com.epharma.ecosystem.repository.merchantapp.MerchantUserRepository;
import com.epharma.ecosystem.repository.userapp.UserUserRepository;
import com.epharma.ecosystem.repository.ProductRepository;
import com.epharma.ecosystem.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Dashboard Statistics Controller
 * Provides centralized statistics for the Admin dashboard
 * Tracks real-time user counts across all apps
 */
@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardStatsController {

    @Autowired(required = false)
    private AdminUserRepository adminUserRepository;
    
    @Autowired(required = false)
    private DoctorUserRepository doctorUserRepository;
    
    @Autowired(required = false)
    private DriverUserRepository driverUserRepository;
    
    @Autowired(required = false)
    private MerchantUserRepository merchantUserRepository;
    
    @Autowired(required = false)
    private UserUserRepository userUserRepository;
    
    @Autowired(required = false)
    private ProductRepository productRepository;
    
    @Autowired(required = false)
    private OrderRepository orderRepository;

    /**
     * Get comprehensive dashboard statistics
     * Returns counts of all registered users by role
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // User counts by role
        Map<String, Long> userCounts = new HashMap<>();
        
        // Count users from each repository
        long totalUsers = 0;
        long totalMerchants = 0;
        long totalDoctors = 0;
        long totalDrivers = 0;
        long totalAdmins = 0;
        
        if (userUserRepository != null) {
            totalUsers = userUserRepository.count();
        }
        if (merchantUserRepository != null) {
            totalMerchants = merchantUserRepository.count();
        }
        if (doctorUserRepository != null) {
            totalDoctors = doctorUserRepository.count();
        }
        if (driverUserRepository != null) {
            totalDrivers = driverUserRepository.count();
        }
        if (adminUserRepository != null) {
            totalAdmins = adminUserRepository.count();
        }
        
        userCounts.put("users", totalUsers);
        userCounts.put("merchants", totalMerchants);
        userCounts.put("doctors", totalDoctors);
        userCounts.put("drivers", totalDrivers);
        userCounts.put("admins", totalAdmins);
        userCounts.put("total", totalUsers + totalMerchants + totalDoctors + totalDrivers + totalAdmins);
        
        stats.put("userCounts", userCounts);
        
        // Active user counts (users who are active)
        Map<String, Long> activeUserCounts = new HashMap<>();
        
        if (userUserRepository != null) {
            activeUserCounts.put("users", userUserRepository.countByIsActiveTrue());
        }
        if (merchantUserRepository != null) {
            activeUserCounts.put("merchants", merchantUserRepository.countByIsActiveTrue());
        }
        if (doctorUserRepository != null) {
            activeUserCounts.put("doctors", doctorUserRepository.countByIsActiveTrue());
        }
        if (driverUserRepository != null) {
            activeUserCounts.put("drivers", driverUserRepository.countByIsActiveTrue());
        }
        
        stats.put("activeUserCounts", activeUserCounts);
        
        // Product counts
        long totalProducts = 0;
        long activeProducts = 0;
        if (productRepository != null) {
            totalProducts = productRepository.count();
            activeProducts = productRepository.countByIsActiveTrue();
        }
        stats.put("totalProducts", totalProducts);
        stats.put("activeProducts", activeProducts);
        
        // Order counts
        long totalOrders = 0;
        if (orderRepository != null) {
            totalOrders = orderRepository.count();
        }
        stats.put("totalOrders", totalOrders);
        
        // Calculate total revenue (placeholder - implement based on your Order entity)
        stats.put("totalRevenue", 0.0);
        
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get user counts only - lightweight endpoint for frequent polling
     */
    @GetMapping("/stats/users")
    public ResponseEntity<Map<String, Long>> getUserCounts() {
        Map<String, Long> counts = new HashMap<>();
        
        counts.put("users", userUserRepository != null ? userUserRepository.count() : 0L);
        counts.put("merchants", merchantUserRepository != null ? merchantUserRepository.count() : 0L);
        counts.put("doctors", doctorUserRepository != null ? doctorUserRepository.count() : 0L);
        counts.put("drivers", driverUserRepository != null ? driverUserRepository.count() : 0L);
        counts.put("admins", adminUserRepository != null ? adminUserRepository.count() : 0L);
        
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        counts.put("total", total);
        
        return ResponseEntity.ok(counts);
    }
    
    /**
     * Get counts for a specific user type
     */
    @GetMapping("/stats/users/{type}")
    public ResponseEntity<Map<String, Object>> getUserCountByType(@PathVariable String type) {
        Map<String, Object> result = new HashMap<>();
        long count = 0;
        
        switch (type.toLowerCase()) {
            case "user":
            case "users":
                count = userUserRepository != null ? userUserRepository.count() : 0;
                break;
            case "merchant":
            case "merchants":
                count = merchantUserRepository != null ? merchantUserRepository.count() : 0;
                break;
            case "doctor":
            case "doctors":
                count = doctorUserRepository != null ? doctorUserRepository.count() : 0;
                break;
            case "driver":
            case "drivers":
                count = driverUserRepository != null ? driverUserRepository.count() : 0;
                break;
            case "admin":
            case "admins":
                count = adminUserRepository != null ? adminUserRepository.count() : 0;
                break;
            default:
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid user type"));
        }
        
        result.put("type", type);
        result.put("count", count);
        
        return ResponseEntity.ok(result);
    }
}
