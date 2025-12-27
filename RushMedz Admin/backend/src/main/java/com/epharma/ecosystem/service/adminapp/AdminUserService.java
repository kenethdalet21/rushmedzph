package com.epharma.ecosystem.service.adminapp;

import com.epharma.ecosystem.model.adminapp.AdminUser;
import com.epharma.ecosystem.repository.adminapp.AdminUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class AdminUserService {
    @Autowired
    private AdminUserRepository adminUserRepository;

    public List<AdminUser> getAllUsers() {
        return adminUserRepository.findAll();
    }

    public Optional<AdminUser> getUserById(Long id) {
        if (id == null) throw new IllegalArgumentException("id cannot be null");
        return adminUserRepository.findById(id);
    }

    public AdminUser saveUser(AdminUser user) {
        if (user == null) throw new IllegalArgumentException("user cannot be null");
        return adminUserRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (id == null) throw new IllegalArgumentException("id cannot be null");
        adminUserRepository.deleteById(id);
    }

    public AdminUser findByUsername(String username) {
        return adminUserRepository.findByUsername(username);
    }
}
