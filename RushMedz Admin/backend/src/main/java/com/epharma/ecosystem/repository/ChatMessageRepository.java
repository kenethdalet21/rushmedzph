package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.ChatMessage;
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
 * Repository for ChatMessage entity
 * Provides database operations for consultation chat messages
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {

    // Find by consultation
    List<ChatMessage> findByConsultationIdOrderByCreatedAtAsc(String consultationId);
    
    // Paginated messages
    Page<ChatMessage> findByConsultationIdOrderByCreatedAtDesc(String consultationId, Pageable pageable);
    
    // Find unread messages
    @Query("SELECT m FROM ChatMessage m WHERE m.consultationId = :consultationId AND m.receiverId = :receiverId AND m.isRead = false ORDER BY m.createdAt ASC")
    List<ChatMessage> findUnreadByConsultationAndReceiver(@Param("consultationId") String consultationId, @Param("receiverId") String receiverId);
    
    // Mark messages as read
    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true, m.readAt = :readAt WHERE m.consultationId = :consultationId AND m.receiverId = :receiverId AND m.isRead = false")
    int markAsRead(@Param("consultationId") String consultationId, @Param("receiverId") String receiverId, @Param("readAt") LocalDateTime readAt);
    
    // Count unread messages
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.consultationId = :consultationId AND m.receiverId = :receiverId AND m.isRead = false")
    long countUnread(@Param("consultationId") String consultationId, @Param("receiverId") String receiverId);
    
    // Find messages after timestamp (for sync)
    @Query("SELECT m FROM ChatMessage m WHERE m.consultationId = :consultationId AND m.createdAt > :after ORDER BY m.createdAt ASC")
    List<ChatMessage> findAfter(@Param("consultationId") String consultationId, @Param("after") LocalDateTime after);
    
    // Delete messages by consultation
    void deleteByConsultationId(String consultationId);
}
