package com.epharma.ecosystem.repository;

import com.epharma.ecosystem.model.PrescriptionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for PrescriptionItem entity
 * Provides database operations for prescription items/medications
 */
@Repository
public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, String> {

    List<PrescriptionItem> findByPrescriptionIdOrderByCreatedAt(String prescriptionId);
    
    List<PrescriptionItem> findByProductId(String productId);
    
    void deleteByPrescriptionId(String prescriptionId);
}
