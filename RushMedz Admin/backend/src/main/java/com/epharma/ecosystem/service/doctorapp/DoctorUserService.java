package com.epharma.ecosystem.service.doctorapp;

import com.epharma.ecosystem.model.doctorapp.DoctorUser;
import com.epharma.ecosystem.repository.doctorapp.DoctorUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class DoctorUserService {
    @Autowired
    private DoctorUserRepository doctorUserRepository;

    public List<DoctorUser> getAllUsers() {
        return doctorUserRepository.findAll();
    }

    public Optional<DoctorUser> getUserById(Long id) {
        if (id == null) throw new IllegalArgumentException("id cannot be null");
        return doctorUserRepository.findById(id);
    }

    public DoctorUser saveUser(DoctorUser user) {
        if (user == null) throw new IllegalArgumentException("user cannot be null");
        return doctorUserRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (id == null) throw new IllegalArgumentException("id cannot be null");
        doctorUserRepository.deleteById(id);
    }

    public DoctorUser findByUsername(String username) {
        return doctorUserRepository.findByUsername(username);
    }
}
