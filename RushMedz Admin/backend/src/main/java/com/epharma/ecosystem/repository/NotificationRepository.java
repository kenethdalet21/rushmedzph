package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.Notification;
import com.epharma.ecosystem.model.Notification.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for Notification entity
 * Provides database operations for notifications across all apps
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    // Find by user
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    
    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    
    // Find unread
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(String userId);
    
    // Count unread
    long countByUserIdAndIsReadFalse(String userId);
    
    // Find by type
    List<Notification> findByUserIdAndNotificationTypeOrderByCreatedAtDesc(String userId, NotificationType type);
    
    // Mark as read
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id = :id")
    int markAsRead(@Param("id") String id, @Param("readAt") LocalDateTime readAt);
    
    // Mark all as read for user
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.userId = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") String userId, @Param("readAt") LocalDateTime readAt);
    
    // Find by reference
    List<Notification> findByReferenceIdAndReferenceType(String referenceId, String referenceType);
    
    // Delete old notifications
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :threshold AND n.isRead = true")
    int deleteOldNotifications(@Param("threshold") LocalDateTime threshold);
    
    // Find notifications pending push
    @Query("SELECT n FROM Notification n WHERE n.isPushSent = false ORDER BY n.createdAt ASC")
    List<Notification> findPendingPush();
}
