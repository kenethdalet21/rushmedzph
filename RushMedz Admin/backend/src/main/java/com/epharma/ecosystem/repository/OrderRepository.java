package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {

    // Find orders by user
    List<Order> findByUserId(String userId);
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);
    
    // Find orders by merchant
    List<Order> findByMerchantId(String merchantId);
    List<Order> findByMerchantIdOrderByCreatedAtDesc(String merchantId);
    List<Order> findByMerchantIdAndStatus(String merchantId, Order.OrderStatus status);
    
    // Find orders by driver
    List<Order> findByDriverId(String driverId);
    List<Order> findByDriverIdOrderByCreatedAtDesc(String driverId);
    List<Order> findByDriverIdAndStatus(String driverId, Order.OrderStatus status);
    
    // Find by status
    List<Order> findByStatus(Order.OrderStatus status);
    List<Order> findByStatusIn(List<Order.OrderStatus> statuses);
    
    // Find available orders for drivers (pending or ready for pickup)
    @Query("SELECT o FROM Order o WHERE o.status IN :statuses AND o.driverId IS NULL ORDER BY o.createdAt DESC")
    List<Order> findAvailableOrdersForDrivers(@Param("statuses") List<Order.OrderStatus> statuses);
    
    // Find orders in date range
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate ORDER BY o.createdAt DESC")
    List<Order> findOrdersInDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Find orders for merchant in date range
    @Query("SELECT o FROM Order o WHERE o.merchantId = :merchantId AND o.createdAt BETWEEN :startDate AND :endDate ORDER BY o.createdAt DESC")
    List<Order> findMerchantOrdersInDateRange(@Param("merchantId") String merchantId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Count orders by status
    long countByStatus(Order.OrderStatus status);
    long countByMerchantIdAndStatus(String merchantId, Order.OrderStatus status);
    
    // Get today's orders for a merchant
    @Query("SELECT o FROM Order o WHERE o.merchantId = :merchantId AND o.createdAt >= :startOfDay ORDER BY o.createdAt DESC")
    List<Order> findTodaysOrdersByMerchant(@Param("merchantId") String merchantId, @Param("startOfDay") LocalDateTime startOfDay);
    
    // Calculate total sales for a merchant
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.merchantId = :merchantId AND o.status = 'DELIVERED'")
    Double calculateTotalSalesByMerchant(@Param("merchantId") String merchantId);
    
    // Get driver earnings
    @Query("SELECT COALESCE(SUM(o.totalAmount * 0.1), 0) FROM Order o WHERE o.driverId = :driverId AND o.status = 'DELIVERED'")
    Double calculateDriverEarnings(@Param("driverId") String driverId);
    
    // Find active orders (not delivered or cancelled)
    @Query("SELECT o FROM Order o WHERE o.status NOT IN ('DELIVERED', 'CANCELLED') ORDER BY o.createdAt DESC")
    List<Order> findActiveOrders();
    
    // Find orders requiring prescription verification
    List<Order> findByPrescriptionRequiredAndPrescriptionVerified(Boolean required, Boolean verified);
}
