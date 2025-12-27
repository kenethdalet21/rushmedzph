package com.epharma.ecosystem.controller.doctorapp;

import com.epharma.ecosystem.model.doctorapp.DoctorUser;
import com.epharma.ecosystem.service.doctorapp.DoctorUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/doctor/users")
public class DoctorUserController {
    @Autowired
    private DoctorUserService doctorUserService;

    @GetMapping
    public List<DoctorUser> getAllUsers() {
        return doctorUserService.getAllUsers();
    }

    @GetMapping("/{id}")
    public Optional<DoctorUser> getUserById(@PathVariable Long id) {
        return doctorUserService.getUserById(id);
    }

    @PostMapping
    public DoctorUser createUser(@RequestBody DoctorUser user) {
        return doctorUserService.saveUser(user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        doctorUserService.deleteUser(id);
    }
}
