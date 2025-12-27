package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ProductImage entity
 * Provides database operations for product images
 */
@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, String> {

    // Find by product
    List<ProductImage> findByProductIdOrderBySortOrderAsc(String productId);
    
    // Find primary image
    Optional<ProductImage> findByProductIdAndIsPrimaryTrue(String productId);
    
    // Set primary image
    @Modifying
    @Query("UPDATE ProductImage p SET p.isPrimary = false WHERE p.productId = :productId")
    int clearPrimaryForProduct(@Param("productId") String productId);
    
    // Delete by product
    void deleteByProductId(String productId);
    
    // Count images for product
    long countByProductId(String productId);
}
