package com.epharma.ecosystem.repository.adminapp;

import com.epharma.ecosystem.model.adminapp.AdminUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {
    AdminUser findByUsername(String username);
    AdminUser findByEmail(String email);
    AdminUser findByPhoneNumber(String phoneNumber);
}
