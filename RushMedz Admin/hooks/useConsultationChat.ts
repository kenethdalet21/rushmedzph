/**
 * useConsultationChat Hook
 * React hook for managing real-time consultation chat between Doctor and User
 * Provides state management for messages, typing indicators, and video calls
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  consultationCommService, 
  ChatMessage, 
  TypingIndicator, 
  VideoCallEvent, 
  ConsultationSession,
  VideoCallState 
} from '../services/ConsultationCommunicationService';

interface UseConsultationChatOptions {
  userId: string;
  userName: string;
  userType: 'patient' | 'doctor';
}

interface UseConsultationChatReturn {
  // Session state
  session: ConsultationSession | null;
  isSessionActive: boolean;
  
  // Messages
  messages: ChatMessage[];
  sendMessage: (content: string, type?: 'text' | 'image' | 'file') => void;
  
  // Typing
  isOtherTyping: boolean;
  setIsTyping: (isTyping: boolean) => void;
  
  // Video call
  videoCallState: VideoCallState;
  isVideoCallActive: boolean;
  isIncomingCall: boolean;
  incomingCallInfo: VideoCallEvent | null;
  startVideoCall: () => void;
  acceptVideoCall: () => void;
  rejectVideoCall: (reason?: string) => void;
  endVideoCall: () => void;
  
  // Session management
  startSession: (params: {
    consultationId: string;
    appointmentId?: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    concern: string;
  }) => void;
  endSession: () => void;
  
  // Consultation timer
  duration: number;
  formattedDuration: string;
}

export function useConsultationChat(options: UseConsultationChatOptions): UseConsultationChatReturn {
  const { userId, userName, userType } = options;
  
  // State
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [videoCallState, setVideoCallState] = useState<VideoCallState>('idle');
  const [incomingCallInfo, setIncomingCallInfo] = useState<VideoCallEvent | null>(null);
  const [duration, setDuration] = useState(0);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeCallIdRef = useRef<string | null>(null);

  // Initialize service
  useEffect(() => {
    consultationCommService.initialize(userId, userName, userType);
    
    return () => {
      // Cleanup on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [userId, userName, userType]);

  // Subscribe to message updates
  useEffect(() => {
    const unsubMessage = consultationCommService.onMessage((message) => {
      setMessages(prev => {
        // Check if message already exists (prevent duplicates)
        const exists = prev.some(m => m.id === message.id);
        if (exists) {
          // Update existing message
          return prev.map(m => m.id === message.id ? message : m);
        }
        // Add new message
        return [...prev, message];
      });
    });

    return unsubMessage;
  }, []);

  // Subscribe to typing indicators
  useEffect(() => {
    const unsubTyping = consultationCommService.onTyping((indicator) => {
      // Only show typing indicator from the other party
      if (indicator.userType !== userType) {
        setIsOtherTyping(indicator.isTyping);
      }
    });

    return unsubTyping;
  }, [userType]);

  // Subscribe to video call events
  useEffect(() => {
    const unsubVideoCall = consultationCommService.onVideoCall((event) => {
      console.log('[useConsultationChat] Video call event:', event.type);
      
      switch (event.type) {
        case 'initiate':
        case 'ring':
          if (event.initiatorId !== userId) {
            // Incoming call
            setVideoCallState('ringing');
            setIncomingCallInfo(event);
            activeCallIdRef.current = event.callId;
          }
          break;
          
        case 'accept':
          setVideoCallState('connected');
          setIncomingCallInfo(null);
          break;
          
        case 'reject':
          setVideoCallState('ended');
          setIncomingCallInfo(null);
          setTimeout(() => setVideoCallState('idle'), 2000);
          break;
          
        case 'end':
          setVideoCallState('ended');
          setIncomingCallInfo(null);
          activeCallIdRef.current = null;
          setTimeout(() => setVideoCallState('idle'), 2000);
          break;
      }
    });

    return unsubVideoCall;
  }, [userId]);

  // Subscribe to session updates
  useEffect(() => {
    const unsubSession = consultationCommService.onSessionUpdate((update) => {
      setSession(prev => prev ? { ...prev, ...update } : null);
      
      if (update.status === 'ended') {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    });

    return unsubSession;
  }, []);

  // Start consultation session
  const startSession = useCallback((params: {
    consultationId: string;
    appointmentId?: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    concern: string;
  }) => {
    const newSession = consultationCommService.startSession(params);
    setSession(newSession);
    setMessages(newSession.messages);
    setDuration(0);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  }, []);

  // End consultation session
  const endSession = useCallback(() => {
    consultationCommService.endSession();
    setSession(null);
    setMessages([]);
    setVideoCallState('idle');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Send message
  const sendMessage = useCallback((content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!content.trim()) return;
    
    const message = consultationCommService.sendMessage(content, type);
    if (message) {
      setMessages(prev => [...prev, message]);
    }
  }, []);

  // Set typing indicator
  const setIsTyping = useCallback((isTyping: boolean) => {
    consultationCommService.sendTypingIndicator(isTyping);
  }, []);

  // Video call actions
  const startVideoCall = useCallback(() => {
    const callId = consultationCommService.initiateVideoCall();
    if (callId) {
      activeCallIdRef.current = callId;
      setVideoCallState('initiating');
    }
  }, []);

  const acceptVideoCall = useCallback(() => {
    if (activeCallIdRef.current) {
      consultationCommService.acceptVideoCall(activeCallIdRef.current);
      setVideoCallState('connecting');
      setIncomingCallInfo(null);
    }
  }, []);

  const rejectVideoCall = useCallback((reason: string = 'declined') => {
    if (activeCallIdRef.current) {
      consultationCommService.rejectVideoCall(activeCallIdRef.current, reason);
      setVideoCallState('idle');
      setIncomingCallInfo(null);
      activeCallIdRef.current = null;
    }
  }, []);

  const endVideoCall = useCallback(() => {
    if (activeCallIdRef.current) {
      consultationCommService.endVideoCall(activeCallIdRef.current);
      setVideoCallState('ended');
      activeCallIdRef.current = null;
    }
  }, []);

  // Format duration as MM:SS
  const formattedDuration = `${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}`;

  return {
    // Session state
    session,
    isSessionActive: session?.status === 'active',
    
    // Messages
    messages,
    sendMessage,
    
    // Typing
    isOtherTyping,
    setIsTyping,
    
    // Video call
    videoCallState,
    isVideoCallActive: videoCallState === 'connected',
    isIncomingCall: videoCallState === 'ringing' && incomingCallInfo !== null,
    incomingCallInfo,
    startVideoCall,
    acceptVideoCall,
    rejectVideoCall,
    endVideoCall,
    
    // Session management
    startSession,
    endSession,
    
    // Timer
    duration,
    formattedDuration,
  };
}

// Export types
export type { UseConsultationChatOptions, UseConsultationChatReturn };
