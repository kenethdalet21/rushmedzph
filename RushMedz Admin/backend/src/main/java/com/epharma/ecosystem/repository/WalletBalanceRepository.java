package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.WalletBalance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletBalanceRepository extends JpaRepository<WalletBalance, String> {
}
