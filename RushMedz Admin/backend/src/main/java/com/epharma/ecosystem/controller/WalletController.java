package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.model.WalletBalance;
import com.epharma.ecosystem.model.WalletTopUp;
import com.epharma.ecosystem.service.WalletService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
@CrossOrigin(origins = "*")
public class WalletController {

    @Autowired
    private WalletService walletService;

    @GetMapping("/balance/{userId}")
    public ResponseEntity<WalletBalance> getBalance(@PathVariable String userId) {
        return ResponseEntity.ok(walletService.getBalance(userId));
    }

    @GetMapping("/topups")
    public ResponseEntity<?> listTopUps(@RequestParam(required = false) String userId, HttpServletRequest req) {
        if (userId != null && !userId.isEmpty()) {
            return ResponseEntity.ok(walletService.listTopUps(userId));
        }
        if (!isAdmin(req)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin role required"));
        }
        return ResponseEntity.ok(walletService.adminListTopUps());
    }

    @PostMapping("/topup")
    public ResponseEntity<?> topUp(@RequestBody Map<String, Object> body) {
        try {
            String userId = (String) body.get("userId");
            Double amount = ((Number) body.get("amount")).doubleValue();
            String method = (String) body.get("paymentMethod");
            WalletTopUp tu = walletService.topUp(userId, amount, method);
            return ResponseEntity.ok(tu);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/deduct")
    public ResponseEntity<?> deduct(@RequestBody Map<String, Object> body) {
        try {
            String userId = (String) body.get("userId");
            Double amount = ((Number) body.get("amount")).doubleValue();
            WalletBalance b = walletService.deduct(userId, amount);
            return ResponseEntity.ok(b);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/admin/refund")
    public ResponseEntity<?> adminRefund(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        if (!isAdmin(req)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin role required"));
        }
        try {
            String topUpId = (String) body.get("topUpId");
            String note = (String) body.getOrDefault("adminNote", "");
            WalletTopUp refund = walletService.adminRefundTopUp(topUpId, note);
            return ResponseEntity.ok(refund);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/admin/adjust")
    public ResponseEntity<?> adminAdjust(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        if (!isAdmin(req)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin role required"));
        }
        try {
            String userId = (String) body.get("userId");
            Double delta = ((Number) body.get("delta")).doubleValue();
            String note = (String) body.getOrDefault("adminNote", "");
            WalletTopUp adj = walletService.adminAdjust(userId, delta, note);
            return ResponseEntity.ok(adj);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    private boolean isAdmin(HttpServletRequest req) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        for (GrantedAuthority ga : auth.getAuthorities()) {
            if ("ROLE_ADMIN".equalsIgnoreCase(ga.getAuthority())) return true;
        }
        return false;
    }
}
