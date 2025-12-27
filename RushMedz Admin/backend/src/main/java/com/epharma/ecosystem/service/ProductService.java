package com.epharma.ecosystem.service;

import com.epharma.ecosystem.model.Product;
import com.epharma.ecosystem.model.ProductImage;
import com.epharma.ecosystem.repository.ProductRepository;
import com.epharma.ecosystem.repository.ProductImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing products in the ecosystem
 * Handles product CRUD operations with real-time updates
 */
@Service
@Transactional
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductImageRepository productImageRepository;

    @Autowired
    private RealTimeEventService realTimeEventService;

    // Create product
    public Product createProduct(Product product) {
        Product saved = productRepository.save(product);
        
        // Broadcast real-time update
        realTimeEventService.broadcastProductCreated(saved);
        
        return saved;
    }

    // Update product
    public Product updateProduct(String productId, Product productData) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        // Update fields
        if (productData.getName() != null) product.setName(productData.getName());
        if (productData.getDescription() != null) product.setDescription(productData.getDescription());
        if (productData.getPrice() != null) product.setPrice(productData.getPrice());
        if (productData.getStock() != null) product.setStock(productData.getStock());
        if (productData.getCategory() != null) product.setCategory(productData.getCategory());
        if (productData.getImageUrl() != null) product.setImageUrl(productData.getImageUrl());
        if (productData.getRequiresPrescription() != null) product.setRequiresPrescription(productData.getRequiresPrescription());
        
        Product saved = productRepository.save(product);
        
        // Broadcast real-time update
        realTimeEventService.broadcastProductUpdated(saved);
        
        return saved;
    }

    // Delete product
    public void deleteProduct(String productId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        String merchantId = product.getMerchantId();
        
        // Delete associated images
        productImageRepository.deleteByProductId(productId);
        
        // Delete product
        productRepository.deleteById(productId);
        
        // Broadcast real-time update
        realTimeEventService.broadcastProductDeleted(productId, merchantId);
    }

    // Get all products
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // Get products by merchant
    public List<Product> getProductsByMerchantId(String merchantId) {
        return productRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId);
    }

    // Get product by ID
    public Optional<Product> getProductById(String productId) {
        return productRepository.findById(productId);
    }

    // Get products by category
    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategoryOrderByName(category);
    }

    // Search products
    public List<Product> searchProducts(String query) {
        return productRepository.searchByNameOrDescription(query);
    }

    // Get products requiring prescription
    public List<Product> getProductsRequiringPrescription() {
        return productRepository.findByRequiresPrescriptionTrue();
    }

    // Update stock
    public Product updateStock(String productId, Integer quantity) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setStock(product.getStock() + quantity);
        Product saved = productRepository.save(product);
        
        // Broadcast real-time update
        realTimeEventService.broadcastProductUpdated(saved);
        
        return saved;
    }

    // Add product image
    public ProductImage addProductImage(String productId, String imageUrl, Boolean isPrimary) {
        // If setting as primary, clear other primaries
        if (isPrimary != null && isPrimary) {
            productImageRepository.clearPrimaryForProduct(productId);
        }
        
        ProductImage image = new ProductImage(productId, imageUrl, isPrimary != null && isPrimary);
        return productImageRepository.save(image);
    }

    // Get product images
    public List<ProductImage> getProductImages(String productId) {
        return productImageRepository.findByProductIdOrderBySortOrderAsc(productId);
    }

    // Delete product image
    public void deleteProductImage(String imageId) {
        productImageRepository.deleteById(imageId);
    }

    // Set primary image
    public ProductImage setPrimaryImage(String productId, String imageId) {
        productImageRepository.clearPrimaryForProduct(productId);
        
        ProductImage image = productImageRepository.findById(imageId)
            .orElseThrow(() -> new RuntimeException("Image not found"));
        
        image.setIsPrimary(true);
        return productImageRepository.save(image);
    }
}
