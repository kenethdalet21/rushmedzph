import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { eventBus } from '../../services/eventBus';
import { useMerchantAuth } from '../../contexts/MerchantAuthContext';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  concern: string;
  avatar?: string;
}

interface Consultation {
  id: string;
  patient: Patient;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  concern: string;
  startTime: Date;
  messages: Message[];
  notes?: string;
  prescription?: string;
  doctorId?: string;
  userId?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'patient' | 'doctor';
  timestamp: Date;
  type: 'text' | 'prescription' | 'system';
}

// Consultation fees by doctor ID
const CONSULTATION_FEES: { [key: string]: number } = {
  'doc1': 500, 'doc2': 600, 'doc3': 550, 'doc4': 450, 'doc5': 700
};

// Quick responses for doctors
const QUICK_RESPONSES = [
  "Thank you for sharing. Can you tell me more about when these symptoms started?",
  "I understand. Are you currently taking any medications?",
  "Do you have any known allergies?",
  "On a scale of 1-10, how severe is your pain/discomfort?",
  "Have you experienced similar symptoms before?",
  "I recommend you take adequate rest and stay hydrated.",
  "Based on your symptoms, I'll prescribe some medication for you.",
  "Please monitor your symptoms and consult again if they worsen.",
];

export default function DoctorConsultationsTab() {
  const { user } = useMerchantAuth();
  const doctorUser = user as any;
  const doctorId = doctorUser?.id || null;
  const doctorName = doctorUser?.name || 'Doctor';
  const consultationFee = doctorId ? CONSULTATION_FEES[doctorId] || 500 : 500;

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [message, setMessage] = useState('');
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescription, setPrescription] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const scrollViewRef = useRef<ScrollView>(null);

  // Subscribe to consultation requests from UserApp
  useEffect(() => {
    if (!doctorId) return;

    // Listen for new consultation requests
    const unsubRequest = eventBus.subscribe('consultationRequested', (payload) => {
      if (payload.doctorId === doctorId) {
        const newConsultation: Consultation = {
          id: payload.consultationId || `consult-${Date.now()}`,
          patient: {
            id: payload.userId,
            name: payload.userName || 'Patient',
            age: payload.userAge || 0,
            gender: payload.userGender || 'Unknown',
            concern: payload.concern || 'General Consultation',
          },
          status: 'pending',
          concern: payload.description || payload.concern || 'General Consultation',
          startTime: new Date(),
          messages: [
            {
              id: `msg-${Date.now()}`,
              text: `Patient is requesting consultation for: ${payload.concern || 'General Consultation'}`,
              sender: 'doctor',
              timestamp: new Date(),
              type: 'system',
            },
            ...(payload.description ? [{
              id: `msg-${Date.now()}-desc`,
              text: payload.description,
              sender: 'patient' as const,
              timestamp: new Date(),
              type: 'text' as const,
            }] : []),
          ],
          doctorId,
          userId: payload.userId,
        };

        setConsultations(prev => [newConsultation, ...prev]);
      }
    });

    // Listen for chat messages from patients
    const unsubMessage = eventBus.subscribe('consultationMessage', (payload) => {
      if (payload.doctorId === doctorId && payload.sender === 'patient') {
        const newMsg: Message = {
          id: `msg-${Date.now()}`,
          text: payload.message,
          sender: 'patient',
          timestamp: new Date(),
          type: 'text',
        };

        setConsultations(prev =>
          prev.map(c =>
            c.id === payload.consultationId
              ? { ...c, messages: [...c.messages, newMsg] }
              : c
          )
        );

        // Update active consultation if it's the current one
        if (activeConsultation?.id === payload.consultationId) {
          setActiveConsultation(prev =>
            prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
          );
        }
      }
    });

    // Listen for cancelled consultations
    const unsubCancelled = eventBus.subscribe('consultationCancelled', (payload) => {
      if (payload.doctorId === doctorId) {
        setConsultations(prev =>
          prev.map(c =>
            c.id === payload.consultationId
              ? { ...c, status: 'cancelled' as const }
              : c
          )
        );
        
        if (activeConsultation?.id === payload.consultationId) {
          Alert.alert('Consultation Cancelled', 'The patient has cancelled this consultation.');
          setShowChatModal(false);
          setActiveConsultation(null);
        }
      }
    });

    return () => {
      unsubRequest();
      unsubMessage();
      unsubCancelled();
    };
  }, [doctorId, activeConsultation]);

  const filteredConsultations = consultations.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const pendingCount = consultations.filter(c => c.status === 'pending').length;
  const activeCount = consultations.filter(c => c.status === 'active').length;

  const acceptConsultation = (consultation: Consultation) => {
    setConsultations(prev =>
      prev.map(c =>
        c.id === consultation.id ? { ...c, status: 'active' as const } : c
      )
    );
    
    const updated = { ...consultation, status: 'active' as const };
    setActiveConsultation(updated);
    
    // Add system message
    const acceptMsg: Message = {
      id: `msg-${Date.now()}`,
      text: 'Doctor has joined the consultation.',
      sender: 'doctor',
      timestamp: new Date(),
      type: 'system',
    };
    
    setConsultations(prev =>
      prev.map(c =>
        c.id === consultation.id 
          ? { ...c, status: 'active' as const, messages: [...c.messages, acceptMsg] }
          : c
      )
    );

    // Emit event to notify UserApp that consultation was accepted
    eventBus.emit('consultationAccepted', {
      consultationId: consultation.id,
      doctorId,
      doctorName,
      userId: consultation.userId,
      status: 'active',
    });
    
    setShowChatModal(true);
  };

  const openChat = (consultation: Consultation) => {
    setActiveConsultation(consultation);
    setShowChatModal(true);
  };

  const sendMessage = () => {
    if (!message.trim() || !activeConsultation) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      text: message,
      sender: 'doctor',
      timestamp: new Date(),
      type: 'text',
    };

    setConsultations(prev =>
      prev.map(c =>
        c.id === activeConsultation.id
          ? { ...c, messages: [...c.messages, newMsg] }
          : c
      )
    );

    setActiveConsultation(prev =>
      prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
    );

    // Emit message event to UserApp
    eventBus.emit('consultationMessage', {
      consultationId: activeConsultation.id,
      doctorId,
      userId: activeConsultation.userId,
      message: message,
      sender: 'doctor',
      timestamp: new Date().toISOString(),
    });

    setMessage('');
  };

  const sendQuickResponse = (text: string) => {
    setMessage(text);
    setShowQuickResponses(false);
  };

  const sendPrescription = () => {
    if (!prescription.trim() || !activeConsultation) return;

    const prescriptionMsg: Message = {
      id: `msg-${Date.now()}-presc`,
      text: `📋 PRESCRIPTION:\n${prescription}`,
      sender: 'doctor',
      timestamp: new Date(),
      type: 'prescription',
    };

    setConsultations(prev =>
      prev.map(c =>
        c.id === activeConsultation.id
          ? { ...c, messages: [...c.messages, prescriptionMsg], prescription }
          : c
      )
    );

    setActiveConsultation(prev =>
      prev ? { ...prev, messages: [...prev.messages, prescriptionMsg], prescription } : null
    );

    // Emit prescription event to UserApp
    eventBus.emit('consultationPrescription', {
      consultationId: activeConsultation.id,
      doctorId,
      doctorName,
      userId: activeConsultation.userId,
      prescription: prescription,
      patientName: activeConsultation.patient.name,
    });

    setPrescription('');
    setShowPrescriptionModal(false);
    Alert.alert('Prescription Sent', 'The prescription has been sent to the patient.');
  };

  const endConsultation = () => {
    if (!activeConsultation) return;

    Alert.alert(
      'End Consultation',
      'Are you sure you want to end this consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: () => {
            const endMsg: Message = {
              id: `msg-${Date.now()}-end`,
              text: 'Consultation has been completed.',
              sender: 'doctor',
              timestamp: new Date(),
              type: 'system',
            };

            setConsultations(prev =>
              prev.map(c =>
                c.id === activeConsultation.id
                  ? { ...c, status: 'completed' as const, messages: [...c.messages, endMsg] }
                  : c
              )
            );

            // Emit completion event
            eventBus.emit('consultationCompleted', {
              consultationId: activeConsultation.id,
              doctorId,
              doctorName,
              userId: activeConsultation.userId,
              patientName: activeConsultation.patient.name,
              fee: consultationFee,
              prescription: activeConsultation.prescription,
            });

            // Also emit appointment completed for earnings tracking
            eventBus.emit('appointmentCompleted', {
              appointmentId: activeConsultation.id,
              doctorId,
              doctorName,
              userId: activeConsultation.userId,
              userName: activeConsultation.patient.name,
              type: 'consultation',
              fee: consultationFee,
            });

            setShowChatModal(false);
            setActiveConsultation(null);
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F39C12';
      case 'active': return '#27AE60';
      case 'completed': return '#3498DB';
      case 'cancelled': return '#E74C3C';
      default: return '#95A5A6';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👨‍⚕️ Online Consultations</Text>
      <Text style={styles.subtitle}>Manage patient consultations</Text>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#FEF5E7' }]}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F8F5' }]}>
          <Text style={styles.statNumber}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#EBF5FB' }]}>
          <Text style={styles.statNumber}>{consultations.filter(c => c.status === 'completed').length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {(['all', 'pending', 'active', 'completed'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Consultations List */}
      <ScrollView style={styles.consultationsList}>
        {filteredConsultations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No consultations</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'pending' ? 'No pending requests' : 'No consultations to show'}
            </Text>
          </View>
        ) : (
          filteredConsultations.map(consultation => (
            <TouchableOpacity
              key={consultation.id}
              style={styles.consultationCard}
              onPress={() => consultation.status === 'pending' ? acceptConsultation(consultation) : openChat(consultation)}
            >
              <View style={styles.consultationHeader}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.patientAvatarText}>
                    {consultation.patient.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.consultationInfo}>
                  <Text style={styles.patientName}>{consultation.patient.name}</Text>
                  <Text style={styles.patientMeta}>
                    {consultation.patient.age} yrs, {consultation.patient.gender}
                  </Text>
                  <View style={styles.concernRow}>
                    <Text style={styles.concernIcon}>🏥</Text>
                    <Text style={styles.concernText}>{consultation.patient.concern}</Text>
                  </View>
                </View>
                <View style={styles.consultationActions}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(consultation.status) }]}>
                    <Text style={styles.statusBadgeText}>{consultation.status}</Text>
                  </View>
                  <Text style={styles.timeText}>{formatTime(consultation.startTime)}</Text>
                </View>
              </View>
              
              {consultation.status === 'pending' && (
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => acceptConsultation(consultation)}
                >
                  <Text style={styles.acceptBtnText}>Accept Consultation</Text>
                </TouchableOpacity>
              )}
              
              {consultation.status === 'active' && (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeIndicatorText}>💬 Tap to continue chat</Text>
                </View>
              )}

              {consultation.prescription && (
                <View style={styles.prescriptionIndicator}>
                  <Text style={styles.prescriptionIndicatorText}>📋 Prescription issued</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Chat Modal */}
      <Modal visible={showChatModal} animationType="slide">
        <View style={styles.chatContainer}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setShowChatModal(false)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.chatPatientInfo}>
              <Text style={styles.chatPatientName}>{activeConsultation?.patient.name}</Text>
              <Text style={styles.chatPatientMeta}>
                {activeConsultation?.patient.concern}
              </Text>
            </View>
            {activeConsultation?.status === 'active' && (
              <TouchableOpacity style={styles.endBtn} onPress={endConsultation}>
                <Text style={styles.endBtnText}>End</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {activeConsultation?.messages.map(msg => (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  msg.sender === 'doctor' ? styles.doctorMessageRow : styles.patientMessageRow,
                  msg.type === 'system' && styles.systemMessageRow,
                ]}
              >
                {msg.type === 'system' ? (
                  <View style={styles.systemMessage}>
                    <Text style={styles.systemMessageText}>{msg.text}</Text>
                  </View>
                ) : (
                  <View style={[
                    styles.messageBubble,
                    msg.sender === 'doctor' ? styles.doctorBubble : styles.patientBubble,
                    msg.type === 'prescription' && styles.prescriptionBubble,
                  ]}>
                    <Text style={[
                      styles.messageText,
                      msg.sender === 'doctor' && styles.doctorMessageText,
                    ]}>{msg.text}</Text>
                    <Text style={styles.messageTime}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Quick Responses */}
          {showQuickResponses && (
            <View style={styles.quickResponsesContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {QUICK_RESPONSES.map((response, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickResponseChip}
                    onPress={() => sendQuickResponse(response)}
                  >
                    <Text style={styles.quickResponseText}>{response}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input Area */}
          {activeConsultation?.status === 'active' && (
            <View style={styles.inputArea}>
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={styles.inputAction}
                  onPress={() => setShowQuickResponses(!showQuickResponses)}
                >
                  <Text>⚡</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inputAction}
                  onPress={() => setShowPrescriptionModal(true)}
                >
                  <Text>📋</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.chatInput}
                placeholder="Type your message..."
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Text style={styles.sendBtnText}>📤</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeConsultation?.status === 'completed' && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedBannerText}>This consultation has been completed</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Prescription Modal */}
      <Modal visible={showPrescriptionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.prescriptionModalContent}>
            <Text style={styles.prescriptionModalTitle}>📋 Write Prescription</Text>
            <Text style={styles.prescriptionModalSubtitle}>
              For: {activeConsultation?.patient.name}
            </Text>
            <TextInput
              style={styles.prescriptionInput}
              placeholder="Enter prescription details...&#10;e.g., Paracetamol 500mg - 1 tablet every 6 hours for 3 days"
              value={prescription}
              onChangeText={setPrescription}
              multiline
              numberOfLines={6}
            />
            <View style={styles.prescriptionModalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowPrescriptionModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendPrescriptionBtn}
                onPress={sendPrescription}
              >
                <Text style={styles.sendPrescriptionBtnText}>Send Prescription</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#7F8C8D', marginBottom: 16 },

  statsRow: { flexDirection: 'row', marginBottom: 16 },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  statLabel: { fontSize: 12, color: '#7F8C8D' },

  filterScroll: { maxHeight: 44, marginBottom: 12 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterTabActive: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
  filterTabText: { fontSize: 14, color: '#333' },
  filterTabTextActive: { color: '#fff', fontWeight: 'bold' },

  consultationsList: { flex: 1 },
  consultationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  consultationHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  consultationInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  patientMeta: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  concernRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  concernIcon: { fontSize: 12, marginRight: 4 },
  concernText: { fontSize: 13, color: '#27AE60' },
  consultationActions: { alignItems: 'flex-end' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  timeText: { fontSize: 11, color: '#95A5A6', marginTop: 4 },

  acceptBtn: {
    backgroundColor: '#27AE60',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  acceptBtnText: { color: '#fff', fontWeight: 'bold' },

  activeIndicator: {
    backgroundColor: '#E8F8F5',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  activeIndicatorText: { color: '#27AE60', fontSize: 13 },

  prescriptionIndicator: {
    backgroundColor: '#FEF5E7',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  prescriptionIndicatorText: { color: '#B7950B', fontSize: 12 },

  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  emptySubtext: { fontSize: 14, color: '#7F8C8D' },

  // Chat Modal Styles
  chatContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    padding: 16,
    paddingTop: 48,
  },
  backBtn: { marginRight: 12 },
  backBtnText: { color: '#fff', fontSize: 16 },
  chatPatientInfo: { flex: 1 },
  chatPatientName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  chatPatientMeta: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  endBtn: { backgroundColor: '#E74C3C', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  endBtnText: { color: '#fff', fontWeight: 'bold' },

  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  messageRow: { marginBottom: 8 },
  doctorMessageRow: { alignItems: 'flex-end' },
  patientMessageRow: { alignItems: 'flex-start' },
  systemMessageRow: { alignItems: 'center' },
  
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  doctorBubble: {
    backgroundColor: '#27AE60',
    borderBottomRightRadius: 4,
  },
  patientBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  prescriptionBubble: {
    backgroundColor: '#FEF5E7',
    borderLeftWidth: 3,
    borderLeftColor: '#F39C12',
  },
  messageText: { fontSize: 14, color: '#333', lineHeight: 20 },
  doctorMessageText: { color: '#fff' },
  messageTime: { fontSize: 10, color: '#999', marginTop: 4, alignSelf: 'flex-end' },

  systemMessage: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  systemMessageText: { fontSize: 12, color: '#7F8C8D', textAlign: 'center' },

  quickResponsesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  quickResponseChip: {
    backgroundColor: '#E8F8F5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    maxWidth: 200,
  },
  quickResponseText: { fontSize: 12, color: '#27AE60' },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputActions: { flexDirection: 'row', marginRight: 8 },
  inputAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnText: { fontSize: 18 },

  completedBanner: {
    backgroundColor: '#EBF5FB',
    padding: 12,
    alignItems: 'center',
  },
  completedBannerText: { color: '#3498DB', fontWeight: '500' },

  // Prescription Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  prescriptionModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  prescriptionModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  prescriptionModalSubtitle: { fontSize: 14, color: '#7F8C8D', marginBottom: 16 },
  prescriptionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  prescriptionModalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  cancelBtnText: { color: '#7F8C8D', fontWeight: '500' },
  sendPrescriptionBtn: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendPrescriptionBtnText: { color: '#fff', fontWeight: 'bold' },
});