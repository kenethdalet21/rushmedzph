package com.epharma.ecosystem.repository.userapp;

import com.epharma.ecosystem.model.userapp.UserUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserUserRepository extends JpaRepository<UserUser, Long> {
    UserUser findByUsername(String username);
    UserUser findByEmail(String email);
    UserUser findByPhoneNumber(String phoneNumber);
}
