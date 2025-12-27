package com.epharma.ecosystem.service.userapp;

import com.epharma.ecosystem.model.userapp.UserUser;
import com.epharma.ecosystem.repository.userapp.UserUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserUserService {
    @Autowired
    private UserUserRepository userUserRepository;

    public List<UserUser> getAllUsers() {
        return userUserRepository.findAll();
    }

    public Optional<UserUser> getUserById(Long userId) {
        if (userId == null) throw new IllegalArgumentException("userId cannot be null");
        return userUserRepository.findById(userId);
    }

    public UserUser saveUser(UserUser user) {
        if (user == null) throw new IllegalArgumentException("user cannot be null");
        return userUserRepository.save(user);
    }

    public void deleteUser(Long userId) {
        if (userId == null) throw new IllegalArgumentException("userId cannot be null");
        userUserRepository.deleteById(userId);
    }

    public UserUser findByUsername(String username) {
        return userUserRepository.findByUsername(username);
    }
    
    public UserUser findByEmail(String email) {
        return userUserRepository.findByEmail(email);
    }
}
