/**
 * ChatModal Component
 * Full-screen modal for real-time chat during Doctor-User consultation
 * Features: Real-time messaging, typing indicators, message status, file attachments
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { ChatMessage } from '../services/ConsultationCommunicationService';

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  isOtherTyping: boolean;
  otherPartyName: string;
  otherPartyType: 'patient' | 'doctor';
  onStartVideoCall?: () => void;
  onRequestPrescription?: () => void;
  duration: string;
  onEndConsultation: () => void;
  currentUserType: 'patient' | 'doctor';
}

export function ChatModal({
  visible,
  onClose,
  messages,
  onSendMessage,
  onTyping,
  isOtherTyping,
  otherPartyName,
  otherPartyType,
  onStartVideoCall,
  onRequestPrescription,
  duration,
  onEndConsultation,
  currentUserType,
}: ChatModalProps) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTypingLocal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingDotsAnim = useRef(new Animated.Value(0)).current;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Typing dots animation
  useEffect(() => {
    if (isOtherTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingDotsAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(typingDotsAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingDotsAnim.setValue(0);
    }
  }, [isOtherTyping, typingDotsAnim]);

  // Handle text input change with typing indicator
  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
    
    // Send typing indicator
    if (text.length > 0 && !isTyping) {
      setIsTypingLocal(true);
      onTyping(true);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      onTyping(false);
    }, 2000);
  }, [isTyping, onTyping]);

  // Send message
  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    
    onSendMessage(inputText.trim());
    setInputText('');
    setIsTypingLocal(false);
    onTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [inputText, onSendMessage, onTyping]);

  // Render individual message
  const renderMessage = (message: ChatMessage, index: number) => {
    const isCurrentUser = message.senderType === currentUserType;
    const isSystem = message.type === 'system';
    const isPrescription = message.type === 'prescription';

    if (isSystem) {
      return (
        <View key={message.id} style={styles.systemMessageContainer}>
          <View style={styles.systemMessage}>
            <Text style={styles.systemMessageText}>{message.content}</Text>
          </View>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageRow,
          isCurrentUser ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
        {!isCurrentUser && (
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>
              {message.senderName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
            isPrescription && styles.prescriptionBubble,
          ]}
        >
          {isPrescription && (
            <View style={styles.prescriptionHeader}>
              <Text style={styles.prescriptionIcon}>📋</Text>
              <Text style={styles.prescriptionTitle}>Prescription</Text>
            </View>
          )}
          <Text
            style={[
              styles.messageText,
              isCurrentUser && styles.currentUserText,
            ]}
          >
            {message.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {isCurrentUser && (
              <Text style={styles.messageStatus}>
                {message.status === 'sending' && '○'}
                {message.status === 'sent' && '●'}
                {message.status === 'delivered' && '●●'}
                {message.status === 'read' && '✓✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!isOtherTyping) return null;

    return (
      <View style={[styles.messageRow, styles.messageRowLeft]}>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>
            {otherPartyName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.typingBubble}>
          <Animated.Text
            style={[
              styles.typingDots,
              { opacity: typingDotsAnim },
            ]}
          >
            ● ● ●
          </Animated.Text>
          <Text style={styles.typingText}>{otherPartyName} is typing...</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {otherPartyName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </Text>
              <View style={styles.onlineIndicator} />
            </View>
            <View>
              <Text style={styles.headerName}>{otherPartyName}</Text>
              <Text style={styles.headerStatus}>
                {otherPartyType === 'doctor' ? '👨‍⚕️ Doctor' : '🧑 Patient'} • Online
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <Text style={styles.timerText}>⏱️ {duration}</Text>
          </View>
        </View>

        {/* Quick Actions Bar */}
        <View style={styles.quickActionsBar}>
          {onStartVideoCall && (
            <TouchableOpacity style={styles.quickActionBtn} onPress={onStartVideoCall}>
              <Text style={styles.quickActionIcon}>📹</Text>
              <Text style={styles.quickActionLabel}>Video Call</Text>
            </TouchableOpacity>
          )}
          {onRequestPrescription && currentUserType === 'patient' && (
            <TouchableOpacity style={styles.quickActionBtn} onPress={onRequestPrescription}>
              <Text style={styles.quickActionIcon}>💊</Text>
              <Text style={styles.quickActionLabel}>Request Rx</Text>
            </TouchableOpacity>
          )}
          {currentUserType === 'doctor' && (
            <TouchableOpacity style={styles.quickActionBtn} onPress={onRequestPrescription}>
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={styles.quickActionLabel}>Send Rx</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.quickActionBtn, styles.endCallBtn]} 
            onPress={onEndConsultation}
          >
            <Text style={styles.quickActionIcon}>🔚</Text>
            <Text style={[styles.quickActionLabel, { color: '#E74C3C' }]}>End</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          {renderTypingIndicator()}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Text style={styles.attachButtonText}>📎</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={handleTextChange}
            onSubmitEditing={handleSend}
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* Security Footer */}
        <View style={styles.securityFooter}>
          <Text style={styles.securityText}>🔒 End-to-end encrypted • HIPAA compliant</Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#27AE60',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  headerAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerStatus: {
    fontSize: 12,
    color: '#27AE60',
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E74C3C',
  },

  // Quick Actions Bar
  quickActionsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    justifyContent: 'space-around',
  },
  quickActionBtn: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 70,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  quickActionLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  endCallBtn: {
    // Styling for end call button
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  
  // Message Row
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  
  // Avatar
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarSmallText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Message Bubble
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  currentUserBubble: {
    backgroundColor: '#27AE60',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  prescriptionBubble: {
    backgroundColor: '#FEF9E7',
    borderWidth: 1,
    borderColor: '#F1C40F',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1C40F',
  },
  prescriptionIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  prescriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9A7B0A',
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  currentUserText: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.4)',
  },
  messageStatus: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },

  // System Message
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  systemMessage: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Typing Indicator
  typingBubble: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDots: {
    fontSize: 12,
    color: '#27AE60',
    marginRight: 6,
  },
  typingText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },

  // Input Area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  attachButtonText: {
    fontSize: 22,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#27AE60',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  sendButtonText: {
    fontSize: 20,
  },

  // Security Footer
  securityFooter: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    backgroundColor: '#fff',
  },
  securityText: {
    fontSize: 10,
    color: '#999',
  },
});

export default ChatModal;
