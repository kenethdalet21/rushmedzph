package com.epharma.ecosystem.controller;

import com.epharma.ecosystem.model.PatientRecord;
import com.epharma.ecosystem.service.PatientRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Patient Record operations
 * Provides API endpoints for patient medical record management
 */
@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientRecordController {

    @Autowired
    private PatientRecordService patientRecordService;

    // Create or update patient record
    @PostMapping
    public ResponseEntity<PatientRecord> savePatientRecord(@RequestBody PatientRecord record) {
        PatientRecord saved = patientRecordService.savePatientRecord(record);
        return ResponseEntity.ok(saved);
    }

    // Get patient record by user ID
    @GetMapping("/user/{userId}")
    public ResponseEntity<PatientRecord> getPatientByUserId(@PathVariable String userId) {
        return patientRecordService.getByUserId(userId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Get or create patient record
    @PostMapping("/user/{userId}/ensure")
    public ResponseEntity<PatientRecord> getOrCreatePatientRecord(
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        String userName = body.get("userName");
        PatientRecord record = patientRecordService.getOrCreatePatientRecord(userId, userName);
        return ResponseEntity.ok(record);
    }

    // Get patients by primary doctor
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<PatientRecord>> getPatientsByDoctor(@PathVariable String doctorId) {
        List<PatientRecord> patients = patientRecordService.getPatientsByPrimaryDoctor(doctorId);
        return ResponseEntity.ok(patients);
    }

    // Search patients by name
    @GetMapping("/search")
    public ResponseEntity<List<PatientRecord>> searchPatients(@RequestParam String name) {
        List<PatientRecord> patients = patientRecordService.searchByName(name);
        return ResponseEntity.ok(patients);
    }

    // Update allergies
    @PatchMapping("/user/{userId}/allergies")
    public ResponseEntity<PatientRecord> updateAllergies(
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        String allergies = body.get("allergies");
        PatientRecord updated = patientRecordService.updateAllergies(userId, allergies);
        return ResponseEntity.ok(updated);
    }

    // Update current medications
    @PatchMapping("/user/{userId}/medications")
    public ResponseEntity<PatientRecord> updateMedications(
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        String medications = body.get("medications");
        PatientRecord updated = patientRecordService.updateCurrentMedications(userId, medications);
        return ResponseEntity.ok(updated);
    }

    // Update chronic conditions
    @PatchMapping("/user/{userId}/conditions")
    public ResponseEntity<PatientRecord> updateConditions(
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        String conditions = body.get("conditions");
        PatientRecord updated = patientRecordService.updateChronicConditions(userId, conditions);
        return ResponseEntity.ok(updated);
    }

    // Check if record exists
    @GetMapping("/user/{userId}/exists")
    public ResponseEntity<Map<String, Boolean>> checkRecordExists(@PathVariable String userId) {
        boolean exists = patientRecordService.recordExists(userId);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}
