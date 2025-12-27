package com.epharma.ecosystem.service.driverapp;

import com.epharma.ecosystem.model.driverapp.DriverUser;
import com.epharma.ecosystem.repository.driverapp.DriverUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class DriverUserService {
    @Autowired
    private DriverUserRepository driverUserRepository;

    public List<DriverUser> getAllUsers() {
        return driverUserRepository.findAll();
    }

    public Optional<DriverUser> getUserById(Long id) {
        if (id == null) throw new IllegalArgumentException("id cannot be null");
        return driverUserRepository.findById(id);
    }

    public DriverUser saveUser(DriverUser user) {
        if (user == null) throw new IllegalArgumentException("user cannot be null");
        return driverUserRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (id == null) throw new IllegalArgumentException("id cannot be null");
        driverUserRepository.deleteById(id);
    }

    public DriverUser findByUsername(String username) {
        return driverUserRepository.findByUsername(username);
    }
}
