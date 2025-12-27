package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByMerchantId(String merchantId);
    List<Product> findByCategory(String category);
    List<Product> findByNameContainingIgnoreCase(String name);
}
