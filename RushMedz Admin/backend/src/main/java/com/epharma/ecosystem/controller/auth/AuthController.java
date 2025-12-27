package com.epharma.ecosystem.controller.auth;

import com.epharma.ecosystem.security.JwtUtil;
import com.epharma.ecosystem.service.adminapp.AdminUserService;
import com.epharma.ecosystem.service.doctorapp.DoctorUserService;
import com.epharma.ecosystem.service.driverapp.DriverUserService;
import com.epharma.ecosystem.service.merchantapp.MerchantUserService;
import com.epharma.ecosystem.service.userapp.UserUserService;
import com.epharma.ecosystem.model.adminapp.AdminUser;
import com.epharma.ecosystem.model.doctorapp.DoctorUser;
import com.epharma.ecosystem.model.driverapp.DriverUser;
import com.epharma.ecosystem.model.merchantapp.MerchantUser;
import com.epharma.ecosystem.model.userapp.UserUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AdminUserService adminUserService;
    @Autowired
    private DoctorUserService doctorUserService;
    @Autowired
    private DriverUserService driverUserService;
    @Autowired
    private MerchantUserService merchantUserService;
    @Autowired
    private UserUserService userUserService;

    // Validates username/password against all app user tables with BCrypt
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String password = payload.get("password");
        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password required"));
        }

        // Try Admin
        AdminUser admin = adminUserService != null ? adminUserService.findByUsername(username) : null;
        if (admin != null && admin.isActive() && passwordEncoder.matches(password, admin.getPassword())) {
            admin.setLastLoginAt(LocalDateTime.now());
            adminUserService.saveUser(admin);
            String token = jwtUtil.generateToken(username, Map.of("role", "admin", "userId", admin.getAdminId()));
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("role", "admin");
            response.put("userId", admin.getAdminId());
            response.put("username", admin.getUsername());
            response.put("email", admin.getEmail());
            response.put("profileImageUrl", admin.getProfileImageUrl());
            return ResponseEntity.ok(response);
        }
        
        // Try Doctor
        DoctorUser doctor = doctorUserService != null ? doctorUserService.findByUsername(username) : null;
        if (doctor != null && doctor.isActive() && passwordEncoder.matches(password, doctor.getPassword())) {
            doctor.setLastLoginAt(LocalDateTime.now());
            doctorUserService.saveUser(doctor);
            String token = jwtUtil.generateToken(username, Map.of("role", "doctor", "userId", doctor.getDoctorId()));
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("role", "doctor");
            response.put("userId", doctor.getDoctorId());
            response.put("username", doctor.getUsername());
            response.put("email", doctor.getEmail());
            response.put("profileImageUrl", doctor.getProfileImageUrl());
            return ResponseEntity.ok(response);
        }
        
        // Try Driver
        DriverUser driver = driverUserService != null ? driverUserService.findByUsername(username) : null;
        if (driver != null && driver.isActive() && passwordEncoder.matches(password, driver.getPassword())) {
            driver.setLastLoginAt(LocalDateTime.now());
            driverUserService.saveUser(driver);
            String token = jwtUtil.generateToken(username, Map.of("role", "driver", "userId", driver.getDriverId()));
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("role", "driver");
            response.put("userId", driver.getDriverId());
            response.put("username", driver.getUsername());
            response.put("email", driver.getEmail());
            response.put("profileImageUrl", driver.getProfileImageUrl());
            return ResponseEntity.ok(response);
        }
        
        // Try Merchant
        MerchantUser merchant = merchantUserService != null ? merchantUserService.findByUsername(username) : null;
        if (merchant != null && merchant.isActive() && passwordEncoder.matches(password, merchant.getPassword())) {
            merchant.setLastLoginAt(LocalDateTime.now());
            merchantUserService.saveUser(merchant);
            String token = jwtUtil.generateToken(username, Map.of("role", "merchant", "userId", merchant.getMerchantId()));
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("role", "merchant");
            response.put("userId", merchant.getMerchantId());
            response.put("username", merchant.getUsername());
            response.put("email", merchant.getEmail());
            response.put("profileImageUrl", merchant.getProfileImageUrl());
            response.put("businessName", merchant.getBusinessName());
            return ResponseEntity.ok(response);
        }
        
        // Try User
        UserUser user = userUserService != null ? userUserService.findByUsername(username) : null;
        if (user != null && user.isActive() && passwordEncoder.matches(password, user.getPassword())) {
            user.setLastLoginAt(LocalDateTime.now());
            userUserService.saveUser(user);
            String token = jwtUtil.generateToken(username, Map.of("role", "user", "userId", user.getUserId()));
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("role", "user");
            response.put("userId", user.getUserId());
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("profileImageUrl", user.getProfileImageUrl());
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
    }
    
    // Register endpoints for each user type
    @PostMapping("/register/user")
    public ResponseEntity<?> registerUser(@RequestBody UserUser user) {
        try {
            if (userUserService.findByUsername(user.getUsername()) != null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            }
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            UserUser savedUser = userUserService.saveUser(user);
            return ResponseEntity.ok(Map.of("message", "User registered successfully", "userId", savedUser.getUserId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }
    
    @PostMapping("/register/merchant")
    public ResponseEntity<?> registerMerchant(@RequestBody MerchantUser merchant) {
        try {
            if (merchantUserService.findByUsername(merchant.getUsername()) != null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            }
            merchant.setPassword(passwordEncoder.encode(merchant.getPassword()));
            MerchantUser savedMerchant = merchantUserService.saveUser(merchant);
            return ResponseEntity.ok(Map.of("message", "Merchant registered successfully", "merchantId", savedMerchant.getMerchantId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }
    
    @PostMapping("/register/doctor")
    public ResponseEntity<?> registerDoctor(@RequestBody DoctorUser doctor) {
        try {
            if (doctorUserService.findByUsername(doctor.getUsername()) != null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            }
            doctor.setPassword(passwordEncoder.encode(doctor.getPassword()));
            DoctorUser savedDoctor = doctorUserService.saveUser(doctor);
            return ResponseEntity.ok(Map.of("message", "Doctor registered successfully", "doctorId", savedDoctor.getDoctorId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }
    
    @PostMapping("/register/driver")
    public ResponseEntity<?> registerDriver(@RequestBody DriverUser driver) {
        try {
            if (driverUserService.findByUsername(driver.getUsername()) != null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            }
            driver.setPassword(passwordEncoder.encode(driver.getPassword()));
            DriverUser savedDriver = driverUserService.saveUser(driver);
            return ResponseEntity.ok(Map.of("message", "Driver registered successfully", "driverId", savedDriver.getDriverId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }
    
    @PostMapping("/register/admin")
    public ResponseEntity<?> registerAdmin(@RequestBody AdminUser admin) {
        try {
            if (adminUserService.findByUsername(admin.getUsername()) != null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            }
            admin.setPassword(passwordEncoder.encode(admin.getPassword()));
            AdminUser savedAdmin = adminUserService.saveUser(admin);
            return ResponseEntity.ok(Map.of("message", "Admin registered successfully", "adminId", savedAdmin.getAdminId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }
}
