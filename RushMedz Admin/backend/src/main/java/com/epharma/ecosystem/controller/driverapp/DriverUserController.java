package com.epharma.ecosystem.controller.driverapp;

import com.epharma.ecosystem.model.driverapp.DriverUser;
import com.epharma.ecosystem.service.driverapp.DriverUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/driver/users")
public class DriverUserController {
    @Autowired
    private DriverUserService driverUserService;

    @GetMapping
    public List<DriverUser> getAllUsers() {
        return driverUserService.getAllUsers();
    }

    @GetMapping("/{id}")
    public Optional<DriverUser> getUserById(@PathVariable Long id) {
        return driverUserService.getUserById(id);
    }

    @PostMapping
    public DriverUser createUser(@RequestBody DriverUser user) {
        return driverUserService.saveUser(user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        driverUserService.deleteUser(id);
    }
}
