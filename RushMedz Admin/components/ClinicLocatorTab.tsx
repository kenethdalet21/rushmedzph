import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
} from 'react-native';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  licenseNumber: string;
  contactNumber: string;
  email: string;
  merchantName: string;
  status: string;
  consultationFee?: number;
  rating?: number;
  experience?: string;
  languages?: string[];
  availability?: string;
  address?: string;
}

// Sample doctors data (fallback when API is offline)
const SAMPLE_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Maria Santos',
    specialization: 'General Medicine',
    licenseNumber: 'PRC-0123456',
    contactNumber: '+63 917 123 4567',
    email: 'dr.santos@clinic.com',
    merchantName: 'Santos Medical Clinic',
    status: 'Available',
    consultationFee: 500,
    rating: 4.8,
    experience: '15 years',
    languages: ['English', 'Filipino', 'Bisaya'],
    availability: 'Mon-Sat, 9AM-5PM',
    address: '123 Health Street, Makati City',
  },
  {
    id: 'doc-2',
    name: 'Dr. Jose Reyes',
    specialization: 'Pediatrics',
    licenseNumber: 'PRC-0234567',
    contactNumber: '+63 918 234 5678',
    email: 'dr.reyes@kidhealth.com',
    merchantName: 'Kids Health Center',
    status: 'Available',
    consultationFee: 600,
    rating: 4.9,
    experience: '20 years',
    languages: ['English', 'Filipino'],
    availability: 'Mon-Fri, 8AM-6PM',
    address: '456 Wellness Ave, Quezon City',
  },
  {
    id: 'doc-3',
    name: 'Dr. Anna Cruz',
    specialization: 'Cardiology',
    licenseNumber: 'PRC-0345678',
    contactNumber: '+63 919 345 6789',
    email: 'dr.cruz@heartcare.com',
    merchantName: 'Heart Care Specialists',
    status: 'Busy',
    consultationFee: 1000,
    rating: 4.7,
    experience: '12 years',
    languages: ['English', 'Filipino', 'Mandarin'],
    availability: 'Tue-Sat, 10AM-4PM',
    address: '789 Medical Plaza, Taguig City',
  },
  {
    id: 'doc-4',
    name: 'Dr. Miguel Torres',
    specialization: 'Dermatology',
    licenseNumber: 'PRC-0456789',
    contactNumber: '+63 920 456 7890',
    email: 'dr.torres@skincare.com',
    merchantName: 'Skin Care Clinic',
    status: 'Available',
    consultationFee: 800,
    rating: 4.6,
    experience: '10 years',
    languages: ['English', 'Filipino'],
    availability: 'Mon-Sat, 9AM-7PM',
    address: '321 Beauty Lane, Pasig City',
  },
  {
    id: 'doc-5',
    name: 'Dr. Patricia Lim',
    specialization: 'OB-Gynecology',
    licenseNumber: 'PRC-0567890',
    contactNumber: '+63 921 567 8901',
    email: 'dr.lim@womenhealth.com',
    merchantName: 'Women\'s Health Center',
    status: 'Available',
    consultationFee: 700,
    rating: 4.9,
    experience: '18 years',
    languages: ['English', 'Filipino', 'Hokkien'],
    availability: 'Mon-Fri, 8AM-5PM',
    address: '654 Care Boulevard, Mandaluyong City',
  },
  {
    id: 'doc-6',
    name: 'Dr. Roberto Garcia',
    specialization: 'Orthopedics',
    licenseNumber: 'PRC-0678901',
    contactNumber: '+63 922 678 9012',
    email: 'dr.garcia@ortho.com',
    merchantName: 'Bone & Joint Clinic',
    status: 'Offline',
    consultationFee: 900,
    rating: 4.5,
    experience: '22 years',
    languages: ['English', 'Filipino', 'Spanish'],
    availability: 'Wed-Sun, 10AM-6PM',
    address: '987 Sports Med Center, Manila',
  },
];

// Specialization filters
const SPECIALIZATIONS = [
  { id: 'all', name: 'All Specializations', icon: '👨‍⚕️' },
  { id: 'General Medicine', name: 'General', icon: '🩺' },
  { id: 'Pediatrics', name: 'Pediatrics', icon: '👶' },
  { id: 'Cardiology', name: 'Cardiology', icon: '❤️' },
  { id: 'Dermatology', name: 'Dermatology', icon: '🧴' },
  { id: 'OB-Gynecology', name: 'OB-GYN', icon: '🤰' },
  { id: 'Orthopedics', name: 'Orthopedics', icon: '🦴' },
  { id: 'Psychiatry', name: 'Psychiatry', icon: '🧠' },
  { id: 'Ophthalmology', name: 'Eye Care', icon: '👁️' },
];

interface ChatModalProps {
  visible: boolean;
  doctor: Doctor | null;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ visible, doctor, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'doctor'; time: string }[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible && doctor) {
      // Add welcome message when opening chat
      setMessages([{
        text: `Hello! I'm Dr. ${doctor.name.replace('Dr. ', '')}. How can I help you today?`,
        sender: 'doctor',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
  }, [visible, doctor]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const userMsg = {
      text: message,
      sender: 'user' as const,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setSending(true);

    // Simulate doctor response
    setTimeout(() => {
      const responses = [
        'I understand your concern. Could you tell me more about your symptoms?',
        'That\'s a common issue. Have you noticed any other symptoms?',
        'I recommend scheduling a full consultation for a proper diagnosis.',
        'You can take over-the-counter medication for now, but please come for a check-up.',
        'Let me know your complete medical history so I can assist you better.',
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages(prev => [...prev, {
        text: randomResponse,
        sender: 'doctor',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      setSending(false);
    }, 1500);
  };

  if (!doctor) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.chatModalContent}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <View style={styles.chatDoctorInfo}>
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>
                  {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </Text>
              </View>
              <View>
                <Text style={styles.chatDoctorName}>{doctor.name}</Text>
                <Text style={styles.chatDoctorSpec}>{doctor.specialization}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.chatCloseBtn}>
              <Text style={styles.chatCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <ScrollView style={styles.chatMessages}>
            {messages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.chatBubble,
                  msg.sender === 'user' ? styles.userBubble : styles.doctorBubble,
                ]}
              >
                <Text style={[
                  styles.chatBubbleText,
                  msg.sender === 'user' ? styles.userBubbleText : styles.doctorBubbleText,
                ]}>{msg.text}</Text>
                <Text style={styles.chatTime}>{msg.time}</Text>
              </View>
            ))}
            {sending && (
              <View style={[styles.chatBubble, styles.doctorBubble]}>
                <ActivityIndicator size="small" color="#27AE60" />
              </View>
            )}
          </ScrollView>

          {/* Chat Input */}
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type your message..."
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={sendMessage}
              multiline
            />
            <TouchableOpacity style={styles.chatSendBtn} onPress={sendMessage}>
              <Text style={styles.chatSendBtnText}>📤</Text>
            </TouchableOpacity>
          </View>

          {/* Disclaimer */}
          <View style={styles.chatDisclaimer}>
            <Text style={styles.chatDisclaimerText}>
              ⚠️ This is a preliminary consultation. For emergencies, please call 911 or visit the nearest hospital.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface DoctorDetailsModalProps {
  visible: boolean;
  doctor: Doctor | null;
  onClose: () => void;
  onStartChat: (doctor: Doctor) => void;
  onStartVideoCall: (doctor: Doctor) => void;
  onBookAppointment: (doctor: Doctor) => void;
}

const DoctorDetailsModal: React.FC<DoctorDetailsModalProps> = ({
  visible,
  doctor,
  onClose,
  onStartChat,
  onStartVideoCall,
  onBookAppointment,
}) => {
  if (!doctor) return null;

  const handleCall = () => {
    const phoneUrl = `tel:${doctor.contactNumber.replace(/[^0-9+]/g, '')}`;
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert('Error', 'Unable to make call');
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${doctor.email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email');
    });
  };

  const handleNavigate = () => {
    if (doctor.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctor.address)}`;
      Linking.openURL(url);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.doctorModalContent}>
          <View style={styles.doctorModalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.doctorModalBody}>
            {/* Doctor Profile */}
            <View style={styles.doctorProfile}>
              <View style={styles.doctorAvatarLarge}>
                <Text style={styles.doctorAvatarLargeText}>
                  {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </Text>
              </View>
              <Text style={styles.doctorNameLarge}>{doctor.name}</Text>
              <Text style={styles.doctorSpecLarge}>{doctor.specialization}</Text>
              <View style={styles.doctorStatusBadge}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: doctor.status === 'Available' ? '#27AE60' : doctor.status === 'Busy' ? '#F39C12' : '#95A5A6' }
                ]} />
                <Text style={styles.statusText}>{doctor.status}</Text>
              </View>
            </View>

            {/* Doctor Info Cards */}
            <View style={styles.infoCardsContainer}>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardIcon}>⭐</Text>
                <Text style={styles.infoCardValue}>{doctor.rating || 'N/A'}</Text>
                <Text style={styles.infoCardLabel}>Rating</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardIcon}>🎓</Text>
                <Text style={styles.infoCardValue}>{doctor.experience || 'N/A'}</Text>
                <Text style={styles.infoCardLabel}>Experience</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardIcon}>💰</Text>
                <Text style={styles.infoCardValue}>₱{doctor.consultationFee || 'N/A'}</Text>
                <Text style={styles.infoCardLabel}>Consult Fee</Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.doctorDetailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🏥</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Clinic</Text>
                  <Text style={styles.detailValue}>{doctor.merchantName}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📍</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{doctor.address || 'Not specified'}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🕐</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Availability</Text>
                  <Text style={styles.detailValue}>{doctor.availability || 'Contact for schedule'}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🗣️</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Languages</Text>
                  <Text style={styles.detailValue}>{doctor.languages?.join(', ') || 'English, Filipino'}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📋</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>License No.</Text>
                  <Text style={styles.detailValue}>{doctor.licenseNumber}</Text>
                </View>
              </View>
            </View>

            {/* Quick Contact */}
            <View style={styles.quickContactSection}>
              <Text style={styles.sectionTitle}>Quick Contact</Text>
              <View style={styles.quickContactRow}>
                <TouchableOpacity style={styles.quickContactBtn} onPress={handleCall}>
                  <Text style={styles.quickContactIcon}>📞</Text>
                  <Text style={styles.quickContactLabel}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickContactBtn} onPress={handleEmail}>
                  <Text style={styles.quickContactIcon}>📧</Text>
                  <Text style={styles.quickContactLabel}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickContactBtn} onPress={handleNavigate}>
                  <Text style={styles.quickContactIcon}>🗺️</Text>
                  <Text style={styles.quickContactLabel}>Navigate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.chatBtn]}
              onPress={() => onStartChat(doctor)}
            >
              <Text style={styles.actionBtnIcon}>💬</Text>
              <Text style={styles.actionBtnText}>Chat Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.videoBtn]}
              onPress={() => onStartVideoCall(doctor)}
            >
              <Text style={styles.actionBtnIcon}>📹</Text>
              <Text style={styles.actionBtnText}>Video Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.bookBtn]}
              onPress={() => onBookAppointment(doctor)}
            >
              <Text style={styles.actionBtnIcon}>📅</Text>
              <Text style={styles.actionBtnText}>Book</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const API_URL = 'http://localhost:8085/api/doctor/users';

export default function ClinicLocatorTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Doctor[]>(SAMPLE_DOCTORS);
  const [filteredResults, setFilteredResults] = useState<Doctor[]>(SAMPLE_DOCTORS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDoctorDetails, setShowDoctorDetails] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatDoctor, setChatDoctor] = useState<Doctor | null>(null);

  // Try to fetch from API on mount, fallback to sample data
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const doctors: Doctor[] = (Array.isArray(data) ? data : []).map((doc: any) => ({
        ...doc,
        consultationFee: doc.consultationFee || Math.floor(Math.random() * 500) + 500,
        rating: doc.rating || (Math.random() * 1 + 4).toFixed(1),
        experience: doc.experience || `${Math.floor(Math.random() * 20) + 5} years`,
        languages: doc.languages || ['English', 'Filipino'],
        availability: doc.availability || 'Mon-Sat, 9AM-5PM',
      }));
      if (doctors.length > 0) {
        setResults(doctors);
        setFilteredResults(doctors);
      }
      setError('');
    } catch (e) {
      console.log('Using sample data - API not available');
      // Keep using sample data
    } finally {
      setLoading(false);
    }
  };

  // Filter based on query and specialization
  useEffect(() => {
    let filtered = results;

    // Filter by specialization
    if (selectedSpecialization !== 'all') {
      filtered = filtered.filter(doc => doc.specialization === selectedSpecialization);
    }

    // Filter by search query
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q) ||
        doc.merchantName.toLowerCase().includes(q) ||
        doc.address?.toLowerCase().includes(q)
      );
    }

    setFilteredResults(filtered);
  }, [query, selectedSpecialization, results]);

  const handleDoctorPress = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorDetails(true);
  };

  const handleStartChat = (doctor: Doctor) => {
    setShowDoctorDetails(false);
    setChatDoctor(doctor);
    setShowChat(true);
  };

  const handleStartVideoCall = (doctor: Doctor) => {
    if (doctor.status !== 'Available') {
      Alert.alert('Doctor Unavailable', 'This doctor is currently not available for video calls. Please try again later or book an appointment.');
      return;
    }
    
    Alert.alert(
      'Start Video Consultation',
      `Start a video call with ${doctor.name}?\n\nConsultation Fee: ₱${doctor.consultationFee}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Call',
          onPress: () => {
            setShowDoctorDetails(false);
            Alert.alert(
              'Connecting...',
              'Connecting to video call...\n\nNote: Video consultation feature requires backend integration with a video call service (e.g., Twilio, Agora, Daily.co).',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const handleBookAppointment = (doctor: Doctor) => {
    Alert.alert(
      'Book Appointment',
      `Book an appointment with ${doctor.name}?\n\nAvailability: ${doctor.availability}\nConsultation Fee: ₱${doctor.consultationFee}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Now',
          onPress: () => {
            setShowDoctorDetails(false);
            Alert.alert('Success', 'Appointment request sent! The clinic will contact you to confirm the schedule.');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return '#27AE60';
      case 'Busy': return '#F39C12';
      default: return '#95A5A6';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏥 Find a Doctor or Clinic</Text>
      <Text style={styles.subtitle}>Chat or video call with verified healthcare professionals</Text>

      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search doctor, specialization, clinic..."
        value={query}
        onChangeText={setQuery}
      />

      {/* Specialization Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {SPECIALIZATIONS.map(spec => (
          <TouchableOpacity
            key={spec.id}
            style={[
              styles.filterChip,
              selectedSpecialization === spec.id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSpecialization(spec.id)}
          >
            <Text style={styles.filterIcon}>{spec.icon}</Text>
            <Text style={[
              styles.filterText,
              selectedSpecialization === spec.id && styles.filterTextActive,
            ]}>{spec.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && <ActivityIndicator style={{ marginTop: 16 }} size="large" color="#27AE60" />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Results */}
      <ScrollView style={styles.results}>
        {filteredResults.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsIcon}>🔍</Text>
            <Text style={styles.noResultsText}>No doctors found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your search or filter</Text>
          </View>
        ) : (
          filteredResults.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.doctorCard}
              onPress={() => handleDoctorPress(doc)}
            >
              <View style={styles.doctorCardContent}>
                <View style={styles.doctorAvatar}>
                  <Text style={styles.doctorAvatarText}>
                    {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{doc.name}</Text>
                  <Text style={styles.doctorSpec}>{doc.specialization}</Text>
                  <Text style={styles.doctorClinic}>{doc.merchantName}</Text>
                  <View style={styles.doctorMeta}>
                    <Text style={styles.doctorRating}>⭐ {doc.rating}</Text>
                    <Text style={styles.doctorFee}>₱{doc.consultationFee}</Text>
                  </View>
                </View>
                <View style={styles.doctorActions}>
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(doc.status) }]}>
                    <Text style={styles.statusIndicatorText}>{doc.status}</Text>
                  </View>
                  <View style={styles.quickActions}>
                    <TouchableOpacity
                      style={styles.quickActionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleStartChat(doc);
                      }}
                    >
                      <Text>💬</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.quickActionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleStartVideoCall(doc);
                      }}
                    >
                      <Text>📹</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Doctor Details Modal */}
      <DoctorDetailsModal
        visible={showDoctorDetails}
        doctor={selectedDoctor}
        onClose={() => setShowDoctorDetails(false)}
        onStartChat={handleStartChat}
        onStartVideoCall={handleStartVideoCall}
        onBookAppointment={handleBookAppointment}
      />

      {/* Chat Modal */}
      <ChatModal
        visible={showChat}
        doctor={chatDoctor}
        onClose={() => {
          setShowChat(false);
          setChatDoctor(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#7F8C8D', marginBottom: 16 },
  
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  
  filterScroll: { maxHeight: 44, marginBottom: 12 },
  filterContainer: { paddingRight: 16 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  filterIcon: { fontSize: 14, marginRight: 4 },
  filterText: { fontSize: 12, color: '#333', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  
  results: { flex: 1 },
  error: { color: 'red', marginTop: 10, textAlign: 'center' },
  
  noResults: { alignItems: 'center', marginTop: 40 },
  noResultsIcon: { fontSize: 48, marginBottom: 12 },
  noResultsText: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  noResultsSubtext: { fontSize: 14, color: '#7F8C8D' },
  
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  doctorCardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  doctorSpec: { fontSize: 14, color: '#27AE60', marginTop: 2 },
  doctorClinic: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  doctorMeta: { flexDirection: 'row', marginTop: 4 },
  doctorRating: { fontSize: 12, color: '#F39C12', marginRight: 12 },
  doctorFee: { fontSize: 12, color: '#3498DB', fontWeight: '600' },
  doctorActions: { alignItems: 'flex-end', justifyContent: 'space-between' },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIndicatorText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  quickActions: { flexDirection: 'row', marginTop: 8 },
  quickActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  doctorModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  doctorModalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCloseBtn: { padding: 8 },
  modalCloseBtnText: { fontSize: 24, color: '#999' },
  doctorModalBody: { paddingHorizontal: 16 },
  
  doctorProfile: { alignItems: 'center', marginBottom: 20 },
  doctorAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorAvatarLargeText: { color: '#fff', fontWeight: 'bold', fontSize: 28 },
  doctorNameLarge: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50' },
  doctorSpecLarge: { fontSize: 16, color: '#27AE60', marginTop: 4 },
  doctorStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, color: '#333' },

  infoCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  infoCard: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    minWidth: 90,
  },
  infoCardIcon: { fontSize: 24, marginBottom: 4 },
  infoCardValue: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  infoCardLabel: { fontSize: 11, color: '#7F8C8D' },

  doctorDetailsSection: { marginBottom: 20 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailIcon: { fontSize: 18, marginRight: 12, width: 24 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#7F8C8D' },
  detailValue: { fontSize: 14, color: '#2C3E50', marginTop: 2 },

  quickContactSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  quickContactRow: { flexDirection: 'row', justifyContent: 'space-around' },
  quickContactBtn: { alignItems: 'center', padding: 12 },
  quickContactIcon: { fontSize: 28, marginBottom: 4 },
  quickContactLabel: { fontSize: 12, color: '#333' },

  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  chatBtn: { backgroundColor: '#3498DB' },
  videoBtn: { backgroundColor: '#9B59B6' },
  bookBtn: { backgroundColor: '#27AE60' },
  actionBtnIcon: { fontSize: 16, marginRight: 4 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  // Chat Modal
  chatModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  chatDoctorInfo: { flexDirection: 'row', alignItems: 'center' },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  chatDoctorName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  chatDoctorSpec: { fontSize: 12, color: '#7F8C8D' },
  chatCloseBtn: { padding: 8 },
  chatCloseBtnText: { fontSize: 20, color: '#999' },

  chatMessages: { flex: 1, padding: 16 },
  chatBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    backgroundColor: '#3498DB',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  doctorBubble: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: { fontSize: 14, lineHeight: 20 },
  userBubbleText: { color: '#fff' },
  doctorBubbleText: { color: '#333' },
  chatTime: { fontSize: 10, color: '#999', marginTop: 4 },

  chatInputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
  chatSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  chatSendBtnText: { fontSize: 20 },

  chatDisclaimer: {
    backgroundColor: '#FEF5E7',
    padding: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  chatDisclaimerText: { fontSize: 10, color: '#B7950B', textAlign: 'center' },
});
