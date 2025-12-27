package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.WalletTopUp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WalletTopUpRepository extends JpaRepository<WalletTopUp, String> {
    List<WalletTopUp> findByUserIdOrderByCreatedAtDesc(String userId);
}
