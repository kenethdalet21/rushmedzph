package com.epharma.ecosystem.repository.doctorapp;

import com.epharma.ecosystem.model.doctorapp.DoctorUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DoctorUserRepository extends JpaRepository<DoctorUser, Long> {
    DoctorUser findByUsername(String username);
    DoctorUser findByEmail(String email);
    DoctorUser findByPhoneNumber(String phoneNumber);
}
