/**
 * VideoCallModal Component
 * Full-screen modal for video consultation between Doctor and User
 * Features: Video/Audio controls, call status, connection management, incoming call UI
 * Note: Actual video requires WebRTC or third-party SDK (Twilio, Agora, Daily.co)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Animated,
  Vibration,
  Alert,
} from 'react-native';
import { VideoCallState, VideoCallEvent } from '../services/ConsultationCommunicationService';

interface VideoCallModalProps {
  visible: boolean;
  callState: VideoCallState;
  isIncoming: boolean;
  incomingCallInfo?: VideoCallEvent | null;
  otherPartyName: string;
  otherPartyType: 'patient' | 'doctor';
  duration: number;
  onAccept: () => void;
  onReject: (reason?: string) => void;
  onEnd: () => void;
  onClose: () => void;
  onSwitchToChat: () => void;
}

export function VideoCallModal({
  visible,
  callState,
  isIncoming,
  incomingCallInfo,
  otherPartyName,
  otherPartyType,
  duration,
  onAccept,
  onReject,
  onEnd,
  onClose,
  onSwitchToChat,
}: VideoCallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Format duration as MM:SS
  const formattedDuration = `${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}`;

  // Pulse animation for incoming call
  useEffect(() => {
    if (isIncoming && callState === 'ringing') {
      // Vibrate for incoming call
      const vibrationPattern = [0, 500, 200, 500];
      Vibration.vibrate(vibrationPattern, true);

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();

      // Ring animation
      Animated.loop(
        Animated.timing(ringAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
      ).start();

      return () => {
        Vibration.cancel();
        pulseAnim.setValue(1);
        ringAnim.setValue(0);
      };
    }
  }, [isIncoming, callState, pulseAnim, ringAnim]);

  // Fade in animation
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  // Toggle handlers
  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOff(!isVideoOff);
  const toggleSpeaker = () => setIsSpeakerOn(!isSpeakerOn);
  const toggleCamera = () => setIsFrontCamera(!isFrontCamera);

  // Handle reject with reason
  const handleReject = () => {
    Alert.alert(
      'Decline Call',
      'Are you sure you want to decline this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => onReject('declined') },
        { text: 'Busy', onPress: () => onReject('busy') },
      ]
    );
  };

  // Handle end call
  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this video call?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Call', style: 'destructive', onPress: onEnd },
      ]
    );
  };

  // Get status text based on call state
  const getStatusText = () => {
    switch (callState) {
      case 'initiating':
        return 'Initiating call...';
      case 'ringing':
        return isIncoming ? 'Incoming video call...' : 'Ringing...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formattedDuration;
      case 'reconnecting':
        return 'Reconnecting...';
      case 'ended':
        return 'Call ended';
      case 'failed':
        return 'Connection failed';
      default:
        return '';
    }
  };

  // Incoming call UI
  const renderIncomingCall = () => (
    <View style={styles.incomingCallContainer}>
      {/* Animated rings */}
      <Animated.View
        style={[
          styles.ringOuter,
          {
            transform: [{ scale: pulseAnim }],
            opacity: ringAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 0],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ringMiddle,
          {
            transform: [{ scale: pulseAnim }],
            opacity: ringAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.6, 0.3, 0.6],
            }),
          },
        ]}
      />

      {/* Avatar */}
      <Animated.View style={[styles.incomingAvatar, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.incomingAvatarText}>
          {otherPartyName.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </Text>
      </Animated.View>

      {/* Caller info */}
      <Text style={styles.incomingTitle}>📹 Incoming Video Call</Text>
      <Text style={styles.incomingName}>{otherPartyName}</Text>
      <Text style={styles.incomingType}>
        {otherPartyType === 'doctor' ? '👨‍⚕️ Doctor' : '🧑 Patient'}
      </Text>

      {/* Action buttons */}
      <View style={styles.incomingActions}>
        <TouchableOpacity style={styles.declineBtn} onPress={handleReject}>
          <Text style={styles.declineBtnIcon}>📞</Text>
          <Text style={styles.declineBtnText}>Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
          <Text style={styles.acceptBtnIcon}>📹</Text>
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Active call UI
  const renderActiveCall = () => (
    <View style={styles.activeCallContainer}>
      {/* Video placeholder - In production, use react-native-webrtc or similar */}
      <View style={styles.remoteVideoPlaceholder}>
        <View style={styles.remoteAvatarLarge}>
          <Text style={styles.remoteAvatarLargeText}>
            {otherPartyName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </Text>
        </View>
        <Text style={styles.remoteVideoText}>{otherPartyName}</Text>
        {callState !== 'connected' && (
          <Text style={styles.connectingText}>{getStatusText()}</Text>
        )}
      </View>

      {/* Local video preview */}
      <View style={styles.localVideoPreview}>
        {isVideoOff ? (
          <View style={styles.localVideoOff}>
            <Text style={styles.localVideoOffIcon}>📷</Text>
            <Text style={styles.localVideoOffText}>Camera Off</Text>
          </View>
        ) : (
          <View style={styles.localVideoPlaceholder}>
            <Text style={styles.localVideoPlaceholderText}>You</Text>
          </View>
        )}
      </View>

      {/* Call info bar */}
      <View style={styles.callInfoBar}>
        <View style={styles.callInfoItem}>
          <Text style={styles.callInfoIcon}>🔒</Text>
          <Text style={styles.callInfoText}>Encrypted</Text>
        </View>
        <View style={styles.callDuration}>
          <Text style={styles.callDurationText}>{getStatusText()}</Text>
        </View>
        <View style={styles.callInfoItem}>
          <Text style={styles.callInfoIcon}>📶</Text>
          <Text style={styles.callInfoText}>HD</Text>
        </View>
      </View>

      {/* Control buttons */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={toggleMute}
          >
            <Text style={styles.controlBtnIcon}>{isMuted ? '🔇' : '🎙️'}</Text>
            <Text style={styles.controlBtnText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]}
            onPress={toggleVideo}
          >
            <Text style={styles.controlBtnIcon}>{isVideoOff ? '📷' : '🎥'}</Text>
            <Text style={styles.controlBtnText}>{isVideoOff ? 'Video On' : 'Video Off'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlBtn, !isSpeakerOn && styles.controlBtnActive]}
            onPress={toggleSpeaker}
          >
            <Text style={styles.controlBtnIcon}>{isSpeakerOn ? '🔊' : '🔈'}</Text>
            <Text style={styles.controlBtnText}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlBtn}
            onPress={toggleCamera}
          >
            <Text style={styles.controlBtnIcon}>🔄</Text>
            <Text style={styles.controlBtnText}>Flip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlsRowSecondary}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onSwitchToChat}>
            <Text style={styles.secondaryBtnIcon}>💬</Text>
            <Text style={styles.secondaryBtnText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
            <Text style={styles.endCallBtnIcon}>📞</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnIcon}>📋</Text>
            <Text style={styles.secondaryBtnText}>Notes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Call ended UI
  const renderCallEnded = () => (
    <View style={styles.callEndedContainer}>
      <View style={styles.callEndedAvatar}>
        <Text style={styles.callEndedAvatarText}>
          {otherPartyName.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </Text>
      </View>
      <Text style={styles.callEndedTitle}>Call Ended</Text>
      <Text style={styles.callEndedDuration}>Duration: {formattedDuration}</Text>
      
      <View style={styles.callEndedActions}>
        <TouchableOpacity style={styles.callAgainBtn}>
          <Text style={styles.callAgainBtnIcon}>📹</Text>
          <Text style={styles.callAgainBtnText}>Call Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backToChatBtn} onPress={onClose}>
          <Text style={styles.backToChatBtnIcon}>💬</Text>
          <Text style={styles.backToChatBtnText}>Back to Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Connection info modal
  const renderConnectionInfo = () => (
    <View style={styles.connectionInfo}>
      <Text style={styles.connectionInfoTitle}>📹 Video Consultation</Text>
      <Text style={styles.connectionInfoText}>
        Note: Full video functionality requires WebRTC integration with a signaling server 
        (e.g., Twilio, Agora, or Daily.co SDK).
      </Text>
      <Text style={styles.connectionInfoText}>
        This is a UI demonstration of the video call interface.
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Background gradient effect */}
        <View style={styles.backgroundGradient} />
        
        {/* Render appropriate UI based on call state */}
        {isIncoming && callState === 'ringing' ? (
          renderIncomingCall()
        ) : callState === 'ended' || callState === 'failed' ? (
          renderCallEnded()
        ) : (
          renderActiveCall()
        )}

        {/* Show connection info for demo purposes */}
        {callState === 'connected' && renderConnectionInfo()}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a2e',
  },

  // Incoming call styles
  incomingCallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ringOuter: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    borderColor: '#27AE60',
  },
  ringMiddle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#27AE60',
  },
  incomingAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  incomingAvatarText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  incomingTitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 8,
  },
  incomingName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  incomingType: {
    fontSize: 16,
    color: '#27AE60',
    marginBottom: 60,
  },
  incomingActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  declineBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
    transform: [{ rotate: '135deg' }],
  },
  declineBtnIcon: {
    fontSize: 28,
    transform: [{ rotate: '-135deg' }],
  },
  declineBtnText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    transform: [{ rotate: '-135deg' }],
  },
  acceptBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
  },
  acceptBtnIcon: {
    fontSize: 28,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },

  // Active call styles
  activeCallContainer: {
    flex: 1,
  },
  remoteVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  remoteAvatarLarge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  remoteAvatarLargeText: {
    color: '#fff',
    fontSize: 56,
    fontWeight: 'bold',
  },
  remoteVideoText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  connectingText: {
    fontSize: 16,
    color: '#27AE60',
    marginTop: 8,
  },
  localVideoPreview: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  localVideoOff: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoOffIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  localVideoOffText: {
    color: '#fff',
    fontSize: 10,
  },
  localVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#2d3436',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoPlaceholderText: {
    color: '#fff',
    fontSize: 14,
  },

  // Call info bar
  callInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  callInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callInfoIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  callInfoText: {
    color: '#aaa',
    fontSize: 12,
  },
  callDuration: {
    backgroundColor: 'rgba(39, 174, 96, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  callDurationText: {
    color: '#27AE60',
    fontSize: 16,
    fontWeight: '600',
  },

  // Controls
  controlsContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  controlBtn: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 70,
  },
  controlBtnActive: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
  },
  controlBtnIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  controlBtnText: {
    color: '#fff',
    fontSize: 11,
  },
  controlsRowSecondary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtn: {
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 20,
  },
  secondaryBtnIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  secondaryBtnText: {
    color: '#aaa',
    fontSize: 11,
  },
  endCallBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
  endCallBtnIcon: {
    fontSize: 32,
    transform: [{ rotate: '-135deg' }],
  },

  // Call ended
  callEndedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  callEndedAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#7F8C8D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  callEndedAvatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  callEndedTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  callEndedDuration: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 40,
  },
  callEndedActions: {
    flexDirection: 'row',
  },
  callAgainBtn: {
    alignItems: 'center',
    backgroundColor: '#27AE60',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 10,
  },
  callAgainBtnIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  callAgainBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  backToChatBtn: {
    alignItems: 'center',
    backgroundColor: '#3498DB',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 10,
  },
  backToChatBtnIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  backToChatBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  // Connection info
  connectionInfo: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F39C12',
  },
  connectionInfoTitle: {
    color: '#F39C12',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  connectionInfoText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
});

export default VideoCallModal;
