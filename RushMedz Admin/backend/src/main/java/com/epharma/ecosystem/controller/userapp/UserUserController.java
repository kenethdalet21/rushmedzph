package com.epharma.ecosystem.controller.userapp;

import com.epharma.ecosystem.model.userapp.UserUser;
import com.epharma.ecosystem.service.userapp.UserUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/user/users")
public class UserUserController {
    @Autowired
    private UserUserService userUserService;

    @GetMapping
    public List<UserUser> getAllUsers() {
        return userUserService.getAllUsers();
    }

    @GetMapping("/{id}")
    public Optional<UserUser> getUserById(@PathVariable Long id) {
        return userUserService.getUserById(id);
    }

    @PostMapping
    public UserUser createUser(@RequestBody UserUser user) {
        return userUserService.saveUser(user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userUserService.deleteUser(id);
    }
}
