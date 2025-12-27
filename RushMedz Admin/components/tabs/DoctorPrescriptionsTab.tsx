import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  Modal,
  TextInput,
  ActivityIndicator 
} from 'react-native';
import { eventBus } from '../../services/eventBus';
import { useMerchantAuth } from '../../contexts/MerchantAuthContext';

interface Prescription {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  doctorId: string;
  doctorName?: string;
  imageUri: string;
  uploadedAt: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  doctorNotes?: string;
}

export default function DoctorPrescriptionsTab() {
  const { user: doctorUser } = useMerchantAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Get the current doctor's ID directly from user profile (doc1, doc2, etc.)
  const currentDoctorId = (doctorUser as any)?.id || null;
  const currentDoctorName = doctorUser ? `Dr. ${(doctorUser as any).name || 'Doctor'}` : 'Doctor';

  // Subscribe to prescription events - only for this doctor
  useEffect(() => {
    const unsubUploaded = eventBus.subscribe('prescriptionUploaded', (payload) => {
      // Only add if this prescription is for the current doctor
      if (payload.prescription.doctorId === currentDoctorId) {
        console.log('Doctor received prescription:', payload.prescription.id, 'for doctor:', payload.prescription.doctorId);
        setPrescriptions(prev => [payload.prescription as Prescription, ...prev]);
      }
    });

    const unsubDeleted = eventBus.subscribe('prescriptionDeleted', (payload) => {
      // Only remove if this prescription was for the current doctor
      if (payload.doctorId === currentDoctorId) {
        console.log('Prescription deleted:', payload.prescriptionId);
        setPrescriptions(prev => prev.filter(p => p.id !== payload.prescriptionId));
      }
    });

    return () => {
      unsubUploaded();
      unsubDeleted();
    };
  }, [currentDoctorId]);

  const handleReviewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDoctorNotes('');
    setShowReviewModal(true);
  };

  const handleApprove = () => {
    if (!selectedPrescription) return;

    setPrescriptions(prev => prev.map(p => 
      p.id === selectedPrescription.id 
        ? { ...p, status: 'approved' as const, doctorNotes }
        : p
    ));

    // Notify the specific user
    eventBus.publish('prescriptionStatusChanged', {
      prescriptionId: selectedPrescription.id,
      userId: selectedPrescription.userId,
      status: 'approved',
      doctorId: currentDoctorId || undefined,
      doctorName: currentDoctorName,
      doctorNotes,
    });

    Alert.alert('Success', 'Prescription approved successfully!');
    setShowReviewModal(false);
    setSelectedPrescription(null);
    setDoctorNotes('');
  };

  const handleReject = () => {
    if (!selectedPrescription) return;
    
    if (!doctorNotes.trim()) {
      Alert.alert('Notes Required', 'Please provide a reason for rejection.');
      return;
    }

    setPrescriptions(prev => prev.map(p => 
      p.id === selectedPrescription.id 
        ? { ...p, status: 'rejected' as const, doctorNotes }
        : p
    ));

    // Notify the specific user
    eventBus.publish('prescriptionStatusChanged', {
      prescriptionId: selectedPrescription.id,
      userId: selectedPrescription.userId,
      status: 'rejected',
      doctorId: currentDoctorId || undefined,
      doctorName: currentDoctorName,
      doctorNotes,
    });

    Alert.alert('Done', 'Prescription rejected. User has been notified.');
    setShowReviewModal(false);
    setSelectedPrescription(null);
    setDoctorNotes('');
  };

  const getFilteredPrescriptions = () => {
    if (filter === 'all') return prescriptions;
    return prescriptions.filter(p => p.status === filter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#27AE60';
      case 'rejected': return '#E74C3C';
      case 'pending': return '#F39C12';
      default: return '#95A5A6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      default: return '📋';
    }
  };

  const pendingCount = prescriptions.filter(p => p.status === 'pending').length;
  const approvedCount = prescriptions.filter(p => p.status === 'approved').length;
  const rejectedCount = prescriptions.filter(p => p.status === 'rejected').length;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Prescriptions Management</Text>
        <Text style={styles.subtitle}>Review and approve patient prescriptions</Text>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.statNumber}>{approvedCount}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
            <Text style={styles.statNumber}>{rejectedCount}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Prescriptions List */}
        {getFilteredPrescriptions().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? 'No prescriptions yet' 
                : `No ${filter} prescriptions`}
            </Text>
            <Text style={styles.emptySubtext}>
              Prescriptions uploaded by patients will appear here
            </Text>
          </View>
        ) : (
          getFilteredPrescriptions().map((prescription) => (
            <View key={prescription.id} style={styles.prescriptionCard}>
              <View style={styles.cardHeader}>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientIcon}>👤</Text>
                  <View>
                    <Text style={styles.patientName}>
                      {prescription.userName || 'Patient'}
                    </Text>
                    <Text style={styles.uploadDate}>
                      {new Date(prescription.uploadedAt).toLocaleDateString()} at{' '}
                      {new Date(prescription.uploadedAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(prescription.status) + '20' }]}>
                  <Text style={styles.statusIcon}>{getStatusIcon(prescription.status)}</Text>
                  <Text style={[styles.statusText, { color: getStatusColor(prescription.status) }]}>
                    {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                  </Text>
                </View>
              </View>

              <Image 
                source={{ uri: prescription.imageUri }} 
                style={styles.prescriptionImage}
                resizeMode="cover"
              />

              {prescription.doctorNotes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Doctor's Notes:</Text>
                  <Text style={styles.notesText}>{prescription.doctorNotes}</Text>
                </View>
              )}

              {prescription.status === 'pending' && (
                <TouchableOpacity 
                  style={styles.reviewButton}
                  onPress={() => handleReviewPrescription(prescription)}
                >
                  <Text style={styles.reviewButtonText}>Review Prescription</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Review Prescription</Text>
            
            {selectedPrescription && (
              <>
                <Text style={styles.modalPatient}>
                  Patient: {selectedPrescription.userName || 'Unknown'}
                </Text>
                <Image 
                  source={{ uri: selectedPrescription.imageUri }} 
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </>
            )}

            <Text style={styles.notesInputLabel}>Doctor's Notes (required for rejection):</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Enter notes or reason for rejection..."
              value={doctorNotes}
              onChangeText={setDoctorNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.rejectButton]}
                onPress={handleReject}
              >
                <Text style={styles.rejectButtonText}>❌ Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.approveButton]}
                onPress={handleApprove}
              >
                <Text style={styles.approveButtonText}>✅ Approve</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowReviewModal(false);
                setSelectedPrescription(null);
                setDoctorNotes('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA', 
    padding: 16,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#27AE60',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8E8E8',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#27AE60',
  },
  filterText: {
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
  },
  prescriptionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  uploadDate: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  prescriptionImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  notesSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  reviewButton: {
    marginTop: 12,
    backgroundColor: '#27AE60',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalPatient: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  notesInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
  },
  rejectButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#E8F5E9',
  },
  approveButtonText: {
    color: '#27AE60',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#95A5A6',
    fontSize: 16,
  },
});