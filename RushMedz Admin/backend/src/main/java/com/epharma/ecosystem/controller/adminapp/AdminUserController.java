package com.epharma.ecosystem.controller.adminapp;

import com.epharma.ecosystem.model.adminapp.AdminUser;
import com.epharma.ecosystem.service.adminapp.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    @Autowired
    private AdminUserService adminUserService;

    @GetMapping
    public List<AdminUser> getAllUsers() {
        return adminUserService.getAllUsers();
    }

    @GetMapping("/{id}")
    public Optional<AdminUser> getUserById(@PathVariable Long id) {
        return adminUserService.getUserById(id);
    }

    @PostMapping
    public AdminUser createUser(@RequestBody AdminUser user) {
        return adminUserService.saveUser(user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        adminUserService.deleteUser(id);
    }
}
