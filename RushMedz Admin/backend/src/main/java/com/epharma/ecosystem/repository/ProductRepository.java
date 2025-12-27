package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Product entity
 * Provides database operations for products across the ecosystem
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    
    // Find by merchant
    List<Product> findByMerchantId(String merchantId);
    
    List<Product> findByMerchantIdOrderByCreatedAtDesc(String merchantId);
    
    // Find by category
    List<Product> findByCategory(String category);
    
    List<Product> findByCategoryOrderByName(String category);
    
    // Search by name
    List<Product> findByNameContainingIgnoreCase(String name);
    
    // Search by name or description
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Product> searchByNameOrDescription(@Param("query") String query);
    
    // Find products requiring prescription
    List<Product> findByRequiresPrescriptionTrue();
    
    // Find by merchant and category
    List<Product> findByMerchantIdAndCategory(String merchantId, String category);
    
    // Find in stock products
    @Query("SELECT p FROM Product p WHERE p.stock > 0 ORDER BY p.name")
    List<Product> findInStock();
    
    // Find products by multiple categories
    @Query("SELECT p FROM Product p WHERE p.category IN :categories ORDER BY p.name")
    List<Product> findByCategories(@Param("categories") List<String> categories);
    
    // Count products by merchant
    long countByMerchantId(String merchantId);
    
    // Count products by category
    long countByCategory(String category);
}
