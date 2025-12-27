package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.model.Product;
import com.epharma.ecosystem.model.ProductImage;
import com.epharma.ecosystem.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for enhanced Product operations
 * Extends product management with image handling and real-time updates
 */
@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class EnhancedProductController {

    @Autowired
    private ProductService productService;

    // Create product
    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        Product created = productService.createProduct(product);
        return ResponseEntity.ok(created);
    }

    // Get all products
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    // Get products by merchant
    @GetMapping("/merchant/{merchantId}")
    public ResponseEntity<List<Product>> getProductsByMerchant(@PathVariable String merchantId) {
        List<Product> products = productService.getProductsByMerchantId(merchantId);
        return ResponseEntity.ok(products);
    }

    // Get product by ID
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id) {
        return productService.getProductById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Update product
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable String id,
            @RequestBody Product productData) {
        Product updated = productService.updateProduct(id, productData);
        return ResponseEntity.ok(updated);
    }

    // Delete product
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // Get products by category
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable String category) {
        List<Product> products = productService.getProductsByCategory(category);
        return ResponseEntity.ok(products);
    }

    // Search products
    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam String q) {
        List<Product> products = productService.searchProducts(q);
        return ResponseEntity.ok(products);
    }

    // Get products requiring prescription
    @GetMapping("/prescription-required")
    public ResponseEntity<List<Product>> getProductsRequiringPrescription() {
        List<Product> products = productService.getProductsRequiringPrescription();
        return ResponseEntity.ok(products);
    }

    // Update stock
    @PatchMapping("/{id}/stock")
    public ResponseEntity<Product> updateStock(
            @PathVariable String id,
            @RequestBody Map<String, Integer> body) {
        Integer quantity = body.get("quantity");
        Product updated = productService.updateStock(id, quantity);
        return ResponseEntity.ok(updated);
    }

    // Add product image
    @PostMapping("/{id}/images")
    public ResponseEntity<ProductImage> addProductImage(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String imageUrl = (String) body.get("imageUrl");
        Boolean isPrimary = (Boolean) body.getOrDefault("isPrimary", false);
        
        ProductImage image = productService.addProductImage(id, imageUrl, isPrimary);
        return ResponseEntity.ok(image);
    }

    // Get product images
    @GetMapping("/{id}/images")
    public ResponseEntity<List<ProductImage>> getProductImages(@PathVariable String id) {
        List<ProductImage> images = productService.getProductImages(id);
        return ResponseEntity.ok(images);
    }

    // Delete product image
    @DeleteMapping("/{productId}/images/{imageId}")
    public ResponseEntity<Void> deleteProductImage(
            @PathVariable String productId,
            @PathVariable String imageId) {
        productService.deleteProductImage(imageId);
        return ResponseEntity.noContent().build();
    }

    // Set primary image
    @PostMapping("/{productId}/images/{imageId}/primary")
    public ResponseEntity<ProductImage> setPrimaryImage(
            @PathVariable String productId,
            @PathVariable String imageId) {
        ProductImage updated = productService.setPrimaryImage(productId, imageId);
        return ResponseEntity.ok(updated);
    }
}
