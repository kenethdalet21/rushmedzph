import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { eventBus } from '../services/eventBus';
import { useUserAuth } from '../contexts/UserAuthContext';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  avatar?: string;
  status: 'online' | 'busy' | 'offline';
  consultationFee: number;
  rating: number;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'doctor';
  timestamp: Date;
  type: 'text' | 'image' | 'prescription' | 'system';
}

interface Consultation {
  id: string;
  doctor: Doctor;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startTime?: Date;
  messages: Message[];
}

// Available doctors for consultation
const AVAILABLE_DOCTORS: Doctor[] = [
  { id: 'doc1', name: 'Dr. Maria Santos', specialization: 'General Medicine', status: 'online', consultationFee: 500, rating: 4.8 },
  { id: 'doc2', name: 'Dr. Jose Reyes', specialization: 'Internal Medicine', status: 'online', consultationFee: 600, rating: 4.9 },
  { id: 'doc3', name: 'Dr. Ana Cruz', specialization: 'Family Medicine', status: 'busy', consultationFee: 550, rating: 4.7 },
  { id: 'doc4', name: 'Dr. Miguel Torres', specialization: 'General Practice', status: 'online', consultationFee: 450, rating: 4.6 },
  { id: 'doc5', name: 'Dr. Patricia Lim', specialization: 'Emergency Medicine', status: 'offline', consultationFee: 700, rating: 4.9 },
];

// Common health concerns for quick selection
const HEALTH_CONCERNS = [
  { id: 'fever', label: 'Fever / Flu', icon: '🤒' },
  { id: 'headache', label: 'Headache', icon: '🤕' },
  { id: 'stomach', label: 'Stomach Issues', icon: '🤢' },
  { id: 'skin', label: 'Skin Problems', icon: '🔴' },
  { id: 'cough', label: 'Cough / Cold', icon: '😷' },
  { id: 'allergy', label: 'Allergies', icon: '🤧' },
  { id: 'pain', label: 'Body Pain', icon: '💢' },
  { id: 'other', label: 'Other Concerns', icon: '❓' },
];

// Simulated doctor responses based on context
const getDoctorResponse = (userMessage: string, concern?: string): string => {
  const lowerMsg = userMessage.toLowerCase();
  
  if (lowerMsg.includes('fever') || concern === 'fever') {
    return "I understand you're experiencing fever. Can you tell me your temperature reading? Also, how long have you had this fever, and do you have any other symptoms like body aches, headache, or cough?";
  } else if (lowerMsg.includes('headache') || concern === 'headache') {
    return "I'm sorry to hear about your headache. Can you describe the pain - is it throbbing, sharp, or dull? Where is it located? Have you taken any medication for it?";
  } else if (lowerMsg.includes('stomach') || lowerMsg.includes('nausea') || concern === 'stomach') {
    return "I see you're having stomach issues. Are you experiencing pain, nausea, vomiting, or diarrhea? When did these symptoms start and what did you last eat?";
  } else if (lowerMsg.includes('skin') || lowerMsg.includes('rash') || concern === 'skin') {
    return "For skin concerns, it helps to see the affected area. Can you describe what it looks like - is there redness, swelling, itching, or any discharge? When did you first notice it?";
  } else if (lowerMsg.includes('cough') || lowerMsg.includes('cold') || concern === 'cough') {
    return "A cough can have many causes. Is it a dry cough or productive (with phlegm)? Do you have any other symptoms like sore throat, runny nose, or difficulty breathing?";
  } else if (lowerMsg.includes('medicine') || lowerMsg.includes('prescription')) {
    return "I'll need to complete the consultation first before providing any prescription. Please tell me more about your symptoms so I can properly assess your condition.";
  } else if (lowerMsg.includes('thank')) {
    return "You're welcome! Take care and don't hesitate to consult again if your symptoms persist or worsen. Get well soon! 🙏";
  } else {
    const responses = [
      "Thank you for sharing that. Can you provide more details about when these symptoms started and how severe they are on a scale of 1-10?",
      "I understand. Are you currently taking any medications? Do you have any allergies I should be aware of?",
      "That's helpful information. Have you experienced similar symptoms before? Any recent changes in diet or routine?",
      "I see. Let me ask a few more questions to better understand your condition. Have you been in contact with anyone who's been sick recently?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
};

export default function ConsultationTab() {
  const { user } = useUserAuth();
  const [currentScreen, setCurrentScreen] = useState<'select' | 'concern' | 'waiting' | 'chat' | 'video'>('select');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [currentAppointmentId, setCurrentAppointmentId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [consultationTime, setConsultationTime] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Subscribe to appointment status changes (e.g., doctor accepts/rejects)
  useEffect(() => {
    const unsubStatus = eventBus.subscribe('appointmentStatusChanged', (payload) => {
      // Only process if this is for the current user's appointment
      if (user?.id && payload.userId === user.id && currentAppointmentId === payload.appointmentId) {
        if (payload.status === 'rejected') {
          Alert.alert(
            'Consultation Declined',
            payload.doctorNotes || 'The doctor is currently unavailable. Please try another doctor.',
            [{ text: 'OK', onPress: () => {
              setConsultation(null);
              setSelectedDoctor(null);
              setSelectedConcern(null);
              setMessages([]);
              setConsultationTime(0);
              setCurrentAppointmentId(null);
              setCurrentScreen('select');
            }}]
          );
        } else if (payload.status === 'accepted') {
          // Doctor accepted, show notification
          Alert.alert('Request Accepted', 'The doctor has accepted your consultation request.');
        }
      }
    });

    // Listen for consultation accepted from DoctorApp
    const unsubAccepted = eventBus.subscribe('consultationAccepted', (payload) => {
      if (user?.id && payload.userId === user.id && currentAppointmentId) {
        // Already in chat, show notification
        if (currentScreen === 'waiting') {
          // Proceed to chat
          setLoading(false);
          setCurrentScreen('chat');
        }
      }
    });

    // Listen for doctor messages
    const unsubMessage = eventBus.subscribe('consultationMessage', (payload) => {
      if (user?.id && payload.userId === user.id && payload.sender === 'doctor') {
        const doctorMsg: Message = {
          id: `msg-${Date.now()}-doc`,
          text: payload.message,
          sender: 'doctor',
          timestamp: new Date(),
          type: 'text',
        };
        setMessages(prev => [...prev, doctorMsg]);
      }
    });

    // Listen for prescriptions from doctor
    const unsubPrescription = eventBus.subscribe('consultationPrescription', (payload) => {
      if (user?.id && payload.userId === user.id) {
        const prescMsg: Message = {
          id: `msg-${Date.now()}-presc`,
          text: `📋 PRESCRIPTION:\n${payload.prescription}`,
          sender: 'doctor',
          timestamp: new Date(),
          type: 'prescription',
        };
        setMessages(prev => [...prev, prescMsg]);
        Alert.alert('Prescription Received', 'The doctor has sent you a prescription. You can view it in your consultation history.');
      }
    });

    // Listen for consultation completed by doctor
    const unsubCompleted = eventBus.subscribe('consultationCompleted', (payload) => {
      if (user?.id && payload.userId === user.id) {
        const endMsg: Message = {
          id: `msg-${Date.now()}-end`,
          text: `Consultation completed by ${payload.doctorName}. Thank you for using our telemedicine service.`,
          sender: 'doctor',
          timestamp: new Date(),
          type: 'system',
        };
        setMessages(prev => [...prev, endMsg]);
        
        setTimeout(() => {
          setConsultation(null);
          setSelectedDoctor(null);
          setSelectedConcern(null);
          setMessages([]);
          setConsultationTime(0);
          setCurrentAppointmentId(null);
          setCurrentScreen('select');
          Alert.alert('Consultation Complete', 'Your consultation has been completed by the doctor.');
        }, 2000);
      }
    });

    return () => {
      unsubStatus();
      unsubAccepted();
      unsubMessage();
      unsubPrescription();
      unsubCompleted();
    };
  }, [user?.id, currentAppointmentId, currentScreen]);

  // Timer for consultation duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentScreen === 'chat' && consultation) {
      interval = setInterval(() => {
        setConsultationTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentScreen, consultation]);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectDoctor = (doctor: Doctor) => {
    if (doctor.status === 'offline') {
      Alert.alert('Doctor Unavailable', 'This doctor is currently offline. Please select another doctor.');
      return;
    }
    setSelectedDoctor(doctor);
    setCurrentScreen('concern');
  };

  const startConsultation = () => {
    if (!selectedDoctor || !selectedConcern) return;

    setCurrentScreen('waiting');
    setLoading(true);

    // Create appointment ID
    const appointmentId = `appt-${Date.now()}`;
    const consultationId = `consult-${Date.now()}`;
    setCurrentAppointmentId(appointmentId);
    
    // Publish appointment requested event
    const concern = HEALTH_CONCERNS.find(c => c.id === selectedConcern);
    eventBus.publish('appointmentRequested', {
      appointment: {
        id: appointmentId,
        userId: user?.id || 'anonymous',
        userName: user?.name || 'Anonymous User',
        userEmail: user?.email,
        userPhone: user?.phone,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        concern: selectedConcern,
        concernLabel: concern?.label,
        requestedAt: new Date().toISOString(),
        status: 'pending',
        consultationType: 'chat',
      },
    });

    // Also emit consultationRequested for DoctorConsultationsTab
    eventBus.emit('consultationRequested', {
      consultationId,
      appointmentId,
      userId: user?.id || 'anonymous',
      userName: user?.name || 'Anonymous User',
      userAge: 30, // Could be from user profile
      userGender: 'Unknown',
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      concern: concern?.label || 'General Consultation',
      description: `Patient is requesting consultation for: ${concern?.label || 'General health concern'}`,
      requestedAt: new Date().toISOString(),
    });

    // Simulate connecting to doctor
    setTimeout(() => {
      const newConsultation: Consultation = {
        id: `consult-${Date.now()}`,
        doctor: selectedDoctor,
        status: 'active',
        startTime: new Date(),
        messages: [],
      };

      const welcomeMessages: Message[] = [
        {
          id: `msg-${Date.now()}-1`,
          text: `Consultation started with ${selectedDoctor.name}`,
          sender: 'doctor',
          timestamp: new Date(),
          type: 'system',
        },
        {
          id: `msg-${Date.now()}-2`,
          text: `Hello! I'm ${selectedDoctor.name.replace('Dr. ', '')} and I'll be assisting you today. I understand you're concerned about ${concern?.label || 'a health issue'}. Please tell me more about what you're experiencing.`,
          sender: 'doctor',
          timestamp: new Date(),
          type: 'text',
        },
      ];

      // Update appointment status to active
      eventBus.publish('appointmentStatusChanged', {
        appointmentId,
        userId: user?.id || 'anonymous',
        doctorId: selectedDoctor.id,
        status: 'active',
        startedAt: new Date().toISOString(),
      });

      setConsultation(newConsultation);
      setMessages(welcomeMessages);
      setLoading(false);
      setConsultationTime(0);
      setCurrentScreen('chat');
    }, 2000);
  };

  const sendMessage = () => {
    if (!message.trim() || !consultation) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      text: message,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMsg]);
    
    // Emit message to DoctorApp
    if (selectedDoctor && currentAppointmentId) {
      eventBus.emit('consultationMessage', {
        consultationId: consultation.id,
        appointmentId: currentAppointmentId,
        userId: user?.id || 'anonymous',
        doctorId: selectedDoctor.id,
        message: message,
        sender: 'patient',
        timestamp: new Date().toISOString(),
      });
    }
    
    setMessage('');
    setIsTyping(true);

    // Simulate doctor typing and responding (only if not getting real responses from DoctorApp)
    setTimeout(() => {
      setIsTyping(false);
      // Auto-response is handled separately, doctor messages come via eventBus
    }, 1500);
  };

  const endConsultation = () => {
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
              text: `Consultation ended. Duration: ${formatTime(consultationTime)}. Thank you for using our telemedicine service. If you need a prescription, it will be sent to your registered email.`,
              sender: 'doctor',
              timestamp: new Date(),
              type: 'system',
            };
            setMessages(prev => [...prev, endMsg]);
            
            // Publish appointment completed event
            if (currentAppointmentId && selectedDoctor) {
              eventBus.publish('appointmentCompleted', {
                appointmentId: currentAppointmentId,
                userId: user?.id || 'anonymous',
                doctorId: selectedDoctor.id,
                duration: consultationTime,
                summary: `Consultation for ${HEALTH_CONCERNS.find(c => c.id === selectedConcern)?.label || 'health concern'}`,
              });
              
              eventBus.publish('appointmentStatusChanged', {
                appointmentId: currentAppointmentId,
                userId: user?.id || 'anonymous',
                doctorId: selectedDoctor.id,
                status: 'completed',
                endedAt: new Date().toISOString(),
              });
            }
            
            setTimeout(() => {
              setConsultation(null);
              setSelectedDoctor(null);
              setSelectedConcern(null);
              setMessages([]);
              setConsultationTime(0);
              setCurrentAppointmentId(null);
              setCurrentScreen('select');
              Alert.alert('Consultation Complete', 'Your consultation summary has been saved to your records.');
            }, 2000);
          },
        },
      ]
    );
  };

  const startVideoCall = () => {
    if (!selectedDoctor) {
      Alert.alert('No Doctor Selected', 'Please select a doctor first.');
      return;
    }

    Alert.alert(
      'Start Video Consultation',
      `Start a video call with ${selectedDoctor.name}?\n\nConsultation Fee: ₱${selectedDoctor.consultationFee}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Video Call',
          onPress: () => {
            setCurrentScreen('video');
            // In production, integrate with video call SDK (Twilio, Agora, etc.)
            setTimeout(() => {
              Alert.alert(
                'Video Call',
                'Connecting to video consultation...\n\nNote: Full video call integration requires a backend video service (Twilio, Agora, or Daily.co).',
                [
                  {
                    text: 'Return to Chat',
                    onPress: () => setCurrentScreen('chat'),
                  },
                ]
              );
            }, 1000);
          },
        },
      ]
    );
  };

  const requestPrescription = () => {
    Alert.alert(
      'Request Prescription',
      'Would you like to request a prescription based on this consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: () => {
            const prescMsg: Message = {
              id: `msg-${Date.now()}-presc`,
              text: "I've noted your request for a prescription. Based on our consultation, I'll prepare the appropriate prescription which will be sent to your registered email and can also be viewed in your Orders section.",
              sender: 'doctor',
              timestamp: new Date(),
              type: 'prescription',
            };
            setMessages(prev => [...prev, prescMsg]);
          },
        },
      ]
    );
  };

  // Doctor Selection Screen
  if (currentScreen === 'select') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>👨‍⚕️ Consult a Doctor</Text>
        <Text style={styles.subtitle}>Select an available doctor for your consultation</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Get medical advice from licensed doctors through chat or video consultation. All consultations are confidential.
          </Text>
        </View>

        <ScrollView style={styles.doctorsList}>
          {AVAILABLE_DOCTORS.map(doctor => (
            <TouchableOpacity
              key={doctor.id}
              style={[styles.doctorCard, doctor.status === 'offline' && styles.doctorCardDisabled]}
              onPress={() => selectDoctor(doctor)}
            >
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorAvatarText}>
                  {doctor.name.split(' ').slice(1).map(n => n[0]).join('')}
                </Text>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: doctor.status === 'online' ? '#27AE60' : doctor.status === 'busy' ? '#F39C12' : '#95A5A6' }
                ]} />
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
                <View style={styles.doctorMeta}>
                  <Text style={styles.doctorRating}>⭐ {doctor.rating}</Text>
                  <Text style={styles.doctorFee}>₱{doctor.consultationFee}</Text>
                </View>
              </View>
              <View style={styles.doctorStatus}>
                <Text style={[
                  styles.statusText,
                  { color: doctor.status === 'online' ? '#27AE60' : doctor.status === 'busy' ? '#F39C12' : '#95A5A6' }
                ]}>
                  {doctor.status === 'online' ? '● Available' : doctor.status === 'busy' ? '● Busy' : '○ Offline'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This is not for emergencies. For life-threatening conditions, please call 911 or go to the nearest hospital.
          </Text>
        </View>
      </View>
    );
  }

  // Health Concern Selection Screen
  if (currentScreen === 'concern') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentScreen('select')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>What brings you in today?</Text>
        <Text style={styles.subtitle}>Select your primary health concern</Text>

        {selectedDoctor && (
          <View style={styles.selectedDoctorCard}>
            <Text style={styles.selectedDoctorLabel}>Consulting with:</Text>
            <Text style={styles.selectedDoctorName}>{selectedDoctor.name}</Text>
            <Text style={styles.selectedDoctorSpec}>{selectedDoctor.specialization}</Text>
          </View>
        )}

        <View style={styles.concernsGrid}>
          {HEALTH_CONCERNS.map(concern => (
            <TouchableOpacity
              key={concern.id}
              style={[
                styles.concernCard,
                selectedConcern === concern.id && styles.concernCardSelected,
              ]}
              onPress={() => setSelectedConcern(concern.id)}
            >
              <Text style={styles.concernIcon}>{concern.icon}</Text>
              <Text style={[
                styles.concernLabel,
                selectedConcern === concern.id && styles.concernLabelSelected,
              ]}>{concern.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.startBtn, !selectedConcern && styles.startBtnDisabled]}
          onPress={startConsultation}
          disabled={!selectedConcern}
        >
          <Text style={styles.startBtnText}>Start Consultation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Waiting Screen
  if (currentScreen === 'waiting') {
    return (
      <View style={styles.waitingContainer}>
        <ActivityIndicator size="large" color="#27AE60" />
        <Text style={styles.waitingTitle}>Connecting to Doctor...</Text>
        <Text style={styles.waitingSubtitle}>Please wait while we connect you with {selectedDoctor?.name}</Text>
      </View>
    );
  }

  // Video Call Screen Placeholder
  if (currentScreen === 'video') {
    return (
      <View style={styles.videoContainer}>
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoIcon}>📹</Text>
          <Text style={styles.videoTitle}>Video Consultation</Text>
          <Text style={styles.videoSubtitle}>with {selectedDoctor?.name}</Text>
          <ActivityIndicator style={{ marginTop: 20 }} color="#fff" />
        </View>
        <TouchableOpacity style={styles.endCallBtn} onPress={() => setCurrentScreen('chat')}>
          <Text style={styles.endCallBtnText}>📞 Return to Chat</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Chat Screen
  return (
    <View style={styles.container}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <View style={styles.chatDoctorInfo}>
          <View style={styles.chatAvatar}>
            <Text style={styles.chatAvatarText}>
              {selectedDoctor?.name.split(' ').slice(1).map(n => n[0]).join('')}
            </Text>
          </View>
          <View>
            <Text style={styles.chatDoctorName}>{selectedDoctor?.name}</Text>
            <Text style={styles.chatDoctorSpec}>{selectedDoctor?.specialization}</Text>
          </View>
        </View>
        <View style={styles.chatHeaderRight}>
          <Text style={styles.timerText}>⏱️ {formatTime(consultationTime)}</Text>
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatBox}
        contentContainerStyle={styles.chatBoxContent}
      >
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.messageContainer,
              msg.sender === 'user' ? styles.userMsgContainer : styles.doctorMsgContainer,
              msg.type === 'system' && styles.systemMsgContainer,
            ]}
          >
            {msg.type === 'system' ? (
              <View style={styles.systemMsg}>
                <Text style={styles.systemMsgText}>{msg.text}</Text>
              </View>
            ) : (
              <View style={[
                styles.messageBubble,
                msg.sender === 'user' ? styles.userBubble : styles.doctorBubble,
                msg.type === 'prescription' && styles.prescriptionBubble,
              ]}>
                {msg.type === 'prescription' && <Text style={styles.prescriptionIcon}>📋</Text>}
                <Text style={[
                  styles.messageText,
                  msg.sender === 'user' && styles.userMessageText,
                ]}>{msg.text}</Text>
                <Text style={styles.messageTime}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>
        ))}
        {isTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>Doctor is typing...</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickAction} onPress={startVideoCall}>
          <Text style={styles.quickActionIcon}>📹</Text>
          <Text style={styles.quickActionText}>Video</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={requestPrescription}>
          <Text style={styles.quickActionIcon}>💊</Text>
          <Text style={styles.quickActionText}>Prescription</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickAction, styles.endAction]} onPress={endConsultation}>
          <Text style={styles.quickActionIcon}>🔚</Text>
          <Text style={[styles.quickActionText, { color: '#E74C3C' }]}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Message Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type your symptoms or questions..."
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={sendMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendBtnText}>📤</Text>
        </TouchableOpacity>
      </View>

      {/* Disclaimer */}
      <View style={styles.chatDisclaimer}>
        <Text style={styles.chatDisclaimerText}>
          🔒 This consultation is confidential and encrypted
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#7F8C8D', marginBottom: 16 },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F8F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  infoIcon: { fontSize: 24, marginRight: 12 },
  infoText: { flex: 1, fontSize: 13, color: '#1ABC9C', lineHeight: 18 },

  doctorsList: { flex: 1 },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
  },
  doctorCardDisabled: { opacity: 0.6 },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  doctorAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  doctorSpec: { fontSize: 13, color: '#27AE60', marginTop: 2 },
  doctorMeta: { flexDirection: 'row', marginTop: 4 },
  doctorRating: { fontSize: 12, color: '#F39C12', marginRight: 12 },
  doctorFee: { fontSize: 12, color: '#3498DB', fontWeight: '600' },
  doctorStatus: { alignItems: 'flex-end' },
  statusText: { fontSize: 12, fontWeight: '600' },

  disclaimer: {
    backgroundColor: '#FEF5E7',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  disclaimerText: { fontSize: 11, color: '#B7950B', textAlign: 'center' },

  backBtn: { marginBottom: 12 },
  backBtnText: { fontSize: 16, color: '#3498DB' },

  selectedDoctorCard: {
    backgroundColor: '#E8F8F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectedDoctorLabel: { fontSize: 12, color: '#7F8C8D' },
  selectedDoctorName: { fontSize: 18, fontWeight: 'bold', color: '#27AE60', marginTop: 4 },
  selectedDoctorSpec: { fontSize: 14, color: '#2C3E50' },

  concernsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  concernCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  concernCardSelected: {
    borderColor: '#27AE60',
    backgroundColor: '#E8F8F5',
  },
  concernIcon: { fontSize: 32, marginBottom: 8 },
  concernLabel: { fontSize: 13, color: '#2C3E50', textAlign: 'center', fontWeight: '500' },
  concernLabelSelected: { color: '#27AE60' },

  startBtn: {
    backgroundColor: '#27AE60',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  startBtnDisabled: { backgroundColor: '#BDC3C7' },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  waitingContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  waitingTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginTop: 20 },
  waitingSubtitle: { fontSize: 14, color: '#7F8C8D', textAlign: 'center', marginTop: 8 },

  videoContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: { fontSize: 80 },
  videoTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 16 },
  videoSubtitle: { fontSize: 16, color: '#aaa', marginTop: 4 },
  endCallBtn: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#E74C3C',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  endCallBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  chatDoctorInfo: { flexDirection: 'row', alignItems: 'center' },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  chatAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  chatDoctorName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  chatDoctorSpec: { fontSize: 12, color: '#7F8C8D' },
  chatHeaderRight: {},
  timerText: { fontSize: 14, color: '#E74C3C', fontWeight: '600' },

  chatBox: { flex: 1, marginBottom: 8 },
  chatBoxContent: { paddingBottom: 16 },
  messageContainer: { marginBottom: 8 },
  userMsgContainer: { alignItems: 'flex-end' },
  doctorMsgContainer: { alignItems: 'flex-start' },
  systemMsgContainer: { alignItems: 'center' },
  
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#3498DB',
    borderBottomRightRadius: 4,
  },
  doctorBubble: {
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
  prescriptionIcon: { fontSize: 20, marginBottom: 4 },
  messageText: { fontSize: 14, color: '#333', lineHeight: 20 },
  userMessageText: { color: '#fff' },
  messageTime: { fontSize: 10, color: '#999', marginTop: 4, alignSelf: 'flex-end' },

  systemMsg: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  systemMsgText: { fontSize: 12, color: '#7F8C8D', textAlign: 'center' },

  typingIndicator: { padding: 8 },
  typingText: { fontSize: 12, color: '#7F8C8D', fontStyle: 'italic' },

  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  quickAction: { alignItems: 'center', padding: 8 },
  quickActionIcon: { fontSize: 20, marginBottom: 2 },
  quickActionText: { fontSize: 11, color: '#333' },
  endAction: {},

  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    backgroundColor: '#fff',
  },
  sendBtn: {
    backgroundColor: '#27AE60',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { fontSize: 20 },

  chatDisclaimer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  chatDisclaimerText: { fontSize: 10, color: '#7F8C8D' },
});
