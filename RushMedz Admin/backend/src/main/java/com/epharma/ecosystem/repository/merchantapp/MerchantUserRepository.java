package com.epharma.ecosystem.repository.merchantapp;

import com.epharma.ecosystem.model.merchantapp.MerchantUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MerchantUserRepository extends JpaRepository<MerchantUser, Long> {
    MerchantUser findByUsername(String username);
    MerchantUser findByEmail(String email);
    MerchantUser findByPhoneNumber(String phoneNumber);
}
