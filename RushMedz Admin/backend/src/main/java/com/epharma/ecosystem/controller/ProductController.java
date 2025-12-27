package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.model.Product;
import com.epharma.ecosystem.repository.ProductRepository;
import jakarta.validation.Valid;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    /**
     * Get all products or filter by merchantId
     */
    @GetMapping
    public ResponseEntity<?> getAllProducts(
            @RequestParam(name = "merchantId", required = false) String merchantId) {
        try {
            List<Product> products;
            if (merchantId != null && !merchantId.isEmpty()) {
                products = productRepository.findByMerchantId(merchantId);
            } else {
                products = productRepository.findAll();
            }
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving products: " + e.getMessage());
        }
    }

    /**
     * Get product by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable String id) {
            if (id == null || id.isEmpty()) {
                return ResponseEntity.badRequest().body("Product ID is required");
            }
        try {
                Optional<Product> product = productRepository.findById(Objects.requireNonNull(id));
            if (product.isPresent()) {
                return ResponseEntity.ok(product.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Product not found with ID: " + id);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving product: " + e.getMessage());
        }
    }

    /**
     * Create a new product
     */
    @PostMapping
    public ResponseEntity<?> createProduct(@Valid @RequestBody Product product) {
        try {
            if (product.getMerchantId() == null || product.getMerchantId().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Merchant ID is required");
            }
            if (product.getName() == null || product.getName().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Product name is required");
            }
            if (product.getPrice() == null || product.getPrice() <= 0) {
                return ResponseEntity.badRequest()
                        .body("Valid price is required");
            }
            if (product.getStock() == null || product.getStock() < 0) {
                return ResponseEntity.badRequest()
                        .body("Valid stock is required");
            }

            // Set defaults
            if (product.getImageUrl() == null || product.getImageUrl().isEmpty()) {
                product.setImageUrl("https://via.placeholder.com/150");
            }
            if (product.getCategory() == null || product.getCategory().isEmpty()) {
                product.setCategory("Others");
            }
            if (product.getCurrency() == null || product.getCurrency().isEmpty()) {
                product.setCurrency("PHP");
            }
            if (product.getRequiresPrescription() == null) {
                product.setRequiresPrescription(false);
            }
            if (product.getMerchantName() == null || product.getMerchantName().isEmpty()) {
                product.setMerchantName("Unknown Merchant");
            }
            if (product.getMerchantEmail() == null || product.getMerchantEmail().isEmpty()) {
                product.setMerchantEmail("");
            }

            Product savedProduct = productRepository.save(product);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating product: " + e.getMessage());
        }
    }

    /**
     * Update an existing product
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable String id, @Valid @RequestBody Product productDetails) {
            if (id == null || id.isEmpty()) {
                return ResponseEntity.badRequest().body("Product ID is required");
            }
        try {
                Optional<Product> optionalProduct = productRepository.findById(Objects.requireNonNull(id));
            if (optionalProduct.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Product not found with ID: " + id);
            }

            Product product = optionalProduct.get();

            // Update fields if provided
            if (productDetails.getName() != null && !productDetails.getName().isEmpty()) {
                product.setName(productDetails.getName());
            }
            if (productDetails.getDescription() != null) {
                product.setDescription(productDetails.getDescription());
            }
            if (productDetails.getPrice() != null && productDetails.getPrice() > 0) {
                product.setPrice(productDetails.getPrice());
            }
            if (productDetails.getStock() != null && productDetails.getStock() >= 0) {
                product.setStock(productDetails.getStock());
            }
            if (productDetails.getCategory() != null && !productDetails.getCategory().isEmpty()) {
                product.setCategory(productDetails.getCategory());
            }
            if (productDetails.getImageUrl() != null && !productDetails.getImageUrl().isEmpty()) {
                product.setImageUrl(productDetails.getImageUrl());
            }
            if (productDetails.getRequiresPrescription() != null) {
                product.setRequiresPrescription(productDetails.getRequiresPrescription());
            }
            if (productDetails.getMerchantName() != null && !productDetails.getMerchantName().isEmpty()) {
                product.setMerchantName(productDetails.getMerchantName());
            }
            if (productDetails.getMerchantEmail() != null && !productDetails.getMerchantEmail().isEmpty()) {
                product.setMerchantEmail(productDetails.getMerchantEmail());
            }

                Product updatedProduct = productRepository.save(Objects.requireNonNull(product));
            return ResponseEntity.ok(updatedProduct);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating product: " + e.getMessage());
        }
    }

    /**
     * Delete a product
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable String id) {
            if (id == null || id.isEmpty()) {
                return ResponseEntity.badRequest().body("Product ID is required");
            }
        try {
                Optional<Product> optionalProduct = productRepository.findById(Objects.requireNonNull(id));
            if (optionalProduct.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Product not found with ID: " + id);
            }

                productRepository.deleteById(Objects.requireNonNull(id));
            return ResponseEntity.ok("Product deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting product: " + e.getMessage());
        }
    }

    /**
     * Search products by name
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchProducts(@RequestParam String query) {
        try {
            List<Product> products = productRepository.findByNameContainingIgnoreCase(query);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error searching products: " + e.getMessage());
        }
    }
}
