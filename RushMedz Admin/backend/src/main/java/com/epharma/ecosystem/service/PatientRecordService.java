package com.epharma.ecosystem.service;

import com.epharma.ecosystem.model.PatientRecord;
import com.epharma.ecosystem.repository.PatientRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing patient records
 * Enables doctors to maintain patient medical history
 */
@Service
@Transactional
public class PatientRecordService {

    @Autowired
    private PatientRecordRepository patientRecordRepository;

    // Create or update patient record
    public PatientRecord savePatientRecord(PatientRecord record) {
        return patientRecordRepository.save(record);
    }

    // Get patient record by user ID
    public Optional<PatientRecord> getByUserId(String userId) {
        return patientRecordRepository.findByUserId(userId);
    }

    // Get or create patient record
    public PatientRecord getOrCreatePatientRecord(String userId, String userName) {
        return patientRecordRepository.findByUserId(userId)
            .orElseGet(() -> {
                PatientRecord newRecord = new PatientRecord(userId, userName);
                return patientRecordRepository.save(newRecord);
            });
    }

    // Get patients by primary doctor
    public List<PatientRecord> getPatientsByPrimaryDoctor(String doctorId) {
        return patientRecordRepository.findByPrimaryDoctorIdOrderByUserName(doctorId);
    }

    // Search patients by name
    public List<PatientRecord> searchByName(String name) {
        return patientRecordRepository.searchByName(name);
    }

    // Update allergies
    public PatientRecord updateAllergies(String userId, String allergies) {
        PatientRecord record = patientRecordRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Patient record not found"));
        record.setAllergies(allergies);
        return patientRecordRepository.save(record);
    }

    // Update current medications
    public PatientRecord updateCurrentMedications(String userId, String medications) {
        PatientRecord record = patientRecordRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Patient record not found"));
        record.setCurrentMedications(medications);
        return patientRecordRepository.save(record);
    }

    // Update chronic conditions
    public PatientRecord updateChronicConditions(String userId, String conditions) {
        PatientRecord record = patientRecordRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Patient record not found"));
        record.setChronicConditions(conditions);
        return patientRecordRepository.save(record);
    }

    // Check if record exists
    public boolean recordExists(String userId) {
        return patientRecordRepository.existsByUserId(userId);
    }
}
