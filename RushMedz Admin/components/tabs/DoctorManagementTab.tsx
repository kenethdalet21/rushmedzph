import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Pressable,
} from 'react-native';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  licenseNumber: string;
  contactNumber: string;
  email: string;
  merchantId: string;
  merchantName: string;
  status: 'active' | 'inactive' | 'pending';
  registeredDate: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
}

export default function DoctorManagementTab() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');

  // Mock data for doctors
  const MOCK_DOCTORS: Doctor[] = [
    {
      id: 'doc_001',
      name: 'Dr. Maria Santos',
      specialization: 'General Medicine',
      licenseNumber: 'PRC-12345',
      contactNumber: '+63-917-123-4567',
      email: 'maria.santos@hospital.com',
      merchantId: 'merchant_001',
      merchantName: 'Saint Luke\'s Medical Center',
      status: 'active',
      registeredDate: '2024-01-15',
      verificationStatus: 'verified',
    },
    {
      id: 'doc_002',
      name: 'Dr. John Cruz',
      specialization: 'Cardiology',
      licenseNumber: 'PRC-12346',
      contactNumber: '+63-917-234-5678',
      email: 'john.cruz@hospital.com',
      merchantId: 'merchant_002',
      merchantName: 'Philippine Hospital',
      status: 'active',
      registeredDate: '2024-01-20',
      verificationStatus: 'verified',
    },
    {
      id: 'doc_003',
      name: 'Dr. Lisa Reyes',
      specialization: 'Pediatrics',
      licenseNumber: 'PRC-12347',
      contactNumber: '+63-917-345-6789',
      email: 'lisa.reyes@clinic.com',
      merchantId: 'merchant_003',
      merchantName: 'Children\'s Care Clinic',
      status: 'active',
      registeredDate: '2024-02-01',
      verificationStatus: 'pending',
    },
    {
      id: 'doc_004',
      name: 'Dr. Robert Tan',
      specialization: 'Dermatology',
      licenseNumber: 'PRC-12348',
      contactNumber: '+63-917-456-7890',
      email: 'robert.tan@clinic.com',
      merchantId: 'merchant_001',
      merchantName: 'Saint Luke\'s Medical Center',
      status: 'inactive',
      registeredDate: '2024-02-10',
      verificationStatus: 'verified',
    },
  ];

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchQuery, statusFilter, doctors]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setDoctors(MOCK_DOCTORS);
    } catch (error) {
      Alert.alert('Error', 'Failed to load doctors');
      setDoctors(MOCK_DOCTORS);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.merchantName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleApprove = (doctorId: string) => {
    Alert.alert(
      'Approve Doctor',
      'Are you sure you want to approve this doctor registration?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Approve',
          onPress: () => {
            setDoctors(doctors.map(doc =>
              doc.id === doctorId
                ? { ...doc, verificationStatus: 'verified', status: 'active' }
                : doc
            ));
            setShowDetailModal(false);
            Alert.alert('Success', 'Doctor approved successfully');
          },
        },
      ]
    );
  };

  const handleReject = (doctorId: string) => {
    Alert.alert(
      'Reject Doctor',
      'Are you sure you want to reject this doctor registration?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Reject',
          onPress: () => {
            setDoctors(doctors.map(doc =>
              doc.id === doctorId
                ? { ...doc, verificationStatus: 'rejected', status: 'inactive' }
                : doc
            ));
            setShowDetailModal(false);
            Alert.alert('Success', 'Doctor registration rejected');
          },
        },
      ]
    );
  };

  const toggleStatus = (doctorId: string) => {
    setDoctors(doctors.map(doc =>
      doc.id === doctorId
        ? { ...doc, status: doc.status === 'active' ? 'inactive' : 'active' }
        : doc
    ));
    Alert.alert('Success', 'Doctor status updated');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#27AE60';
      case 'inactive':
        return '#E74C3C';
      case 'pending':
        return '#F39C12';
      default:
        return '#7F8C8D';
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#27AE60';
      case 'pending':
        return '#F39C12';
      case 'rejected':
        return '#E74C3C';
      default:
        return '#7F8C8D';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Doctor Management</Text>
      <Text style={styles.statsText}>Total Doctors: {doctors.length}</Text>

      {/* Search and Filter */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search doctors by name, specialization, or hospital..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#999"
      />

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {['all', 'active', 'inactive', 'pending'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              statusFilter === status && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(status as any)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === status && styles.filterButtonTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Doctors List */}
      {loading ? (
        <ActivityIndicator size="large" color="#3498DB" style={styles.loader} />
      ) : filteredDoctors.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👨‍⚕️</Text>
          <Text style={styles.emptyText}>No doctors found</Text>
        </View>
      ) : (
        <ScrollView style={styles.doctorsList}>
          {filteredDoctors.map(doctor => (
            <TouchableOpacity
              key={doctor.id}
              style={styles.doctorCard}
              onPress={() => {
                setSelectedDoctor(doctor);
                setShowDetailModal(true);
              }}
            >
              <View style={styles.doctorHeader}>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{doctor.name}</Text>
                  <Text style={styles.specialization}>{doctor.specialization}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(doctor.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.doctorDetails}>
                <Text style={styles.detailText}>
                  License: <Text style={styles.detailValue}>{doctor.licenseNumber}</Text>
                </Text>
                <Text style={styles.detailText}>
                  Hospital: <Text style={styles.detailValue}>{doctor.merchantName}</Text>
                </Text>
                <Text style={styles.detailText}>
                  Registered:{' '}
                  <Text style={styles.detailValue}>{doctor.registeredDate}</Text>
                </Text>
              </View>

              <View style={styles.verificationRow}>
                <View
                  style={[
                    styles.verificationBadge,
                    {
                      backgroundColor: getVerificationStatusColor(
                        doctor.verificationStatus
                      ),
                    },
                  ]}
                >
                  <Text style={styles.verificationText}>
                    {doctor.verificationStatus.charAt(0).toUpperCase() +
                      doctor.verificationStatus.slice(1)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Detail Modal */}
      {selectedDoctor && (
        <Modal
          visible={showDetailModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDetailModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Doctor Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Personal Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailContent}>{selectedDoctor.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Specialization:</Text>
                  <Text style={styles.detailContent}>
                    {selectedDoctor.specialization}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>License Number:</Text>
                  <Text style={styles.detailContent}>
                    {selectedDoctor.licenseNumber}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Contact Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailContent}>{selectedDoctor.contactNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailContent}>{selectedDoctor.email}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Organization</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hospital/Clinic:</Text>
                  <Text style={styles.detailContent}>{selectedDoctor.merchantName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Registered Date:</Text>
                  <Text style={styles.detailContent}>
                    {selectedDoctor.registeredDate}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Status & Verification</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Status:</Text>
                  <View
                    style={[
                      styles.smallBadge,
                      {
                        backgroundColor: getStatusColor(selectedDoctor.status),
                      },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {selectedDoctor.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Verification:</Text>
                  <View
                    style={[
                      styles.smallBadge,
                      {
                        backgroundColor: getVerificationStatusColor(
                          selectedDoctor.verificationStatus
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {selectedDoctor.verificationStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              {selectedDoctor.verificationStatus === 'pending' ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(selectedDoctor.id)}
                  >
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(selectedDoctor.id)}
                  >
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    selectedDoctor.status === 'active'
                      ? styles.deactivateButton
                      : styles.activateButton,
                  ]}
                  onPress={() => toggleStatus(selectedDoctor.id)}
                >
                  <Text style={styles.actionButtonText}>
                    {selectedDoctor.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2C3E50',
  },
  statsText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  doctorsList: {
    flex: 1,
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  specialization: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  doctorDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  detailValue: {
    fontWeight: '500',
    color: '#333',
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  verificationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  verificationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    fontSize: 24,
    color: '#7F8C8D',
  },
  modalBody: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailContent: {
    fontSize: 12,
    color: '#333',
    flex: 1.5,
    textAlign: 'right',
  },
  smallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  approveButton: {
    backgroundColor: '#27AE60',
  },
  rejectButton: {
    backgroundColor: '#E74C3C',
  },
  activateButton: {
    backgroundColor: '#27AE60',
  },
  deactivateButton: {
    backgroundColor: '#E74C3C',
  },
});
