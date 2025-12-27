package com.epharma.ecosystem.repository.driverapp;

import com.epharma.ecosystem.model.driverapp.DriverUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverUserRepository extends JpaRepository<DriverUser, Long> {
    DriverUser findByUsername(String username);
    DriverUser findByEmail(String email);
    DriverUser findByPhoneNumber(String phoneNumber);
    
    // Count methods for dashboard
    long countByIsActiveTrue();
    long countByIsActiveFalse();
    
    // Find all active drivers
    List<DriverUser> findByIsActiveTrue();
}
