package com.epharma.ecosystem.repository.userapp;

import com.epharma.ecosystem.model.userapp.UserUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserUserRepository extends JpaRepository<UserUser, Long> {
    UserUser findByUsername(String username);
    UserUser findByEmail(String email);
    UserUser findByPhoneNumber(String phoneNumber);
    
    // Count methods for dashboard
    long countByIsActiveTrue();
    long countByIsActiveFalse();
    
    // Find all active users
    List<UserUser> findByIsActiveTrue();
}
