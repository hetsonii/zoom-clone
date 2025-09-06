// hooks/useCaptions.ts
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { CaptionSession, TranscriptEntry, CaptionSettings } from '@/lib/captions/types';
import { CaptionStorage } from '@/lib/captions/storage';
import { formatTranscript } from '@/lib/captions/formatters';

interface UseCaptionsOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface UseCaptionsReturn {
  isListening: boolean;
  transcript: TranscriptEntry[];
  currentSession: CaptionSession | null;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
  clearTranscript: () => void;
  downloadTranscript: (format: 'text' | 'srt' | 'webvtt') => void;
  sessions: CaptionSession[];
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

export function useCaptions(options: UseCaptionsOptions = {}): UseCaptionsReturn {
  const {
    language = 'en',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentSession, setCurrentSession] = useState<CaptionSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<CaptionSession[]>([]);

  const recognitionRef = useRef<any>(null);
  const storage = useRef(new CaptionStorage());
  const beginTimeRef = useRef<Date | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                                (window as any).SpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.maxAlternatives = maxAlternatives;
        recognition.lang = language;

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
          beginTimeRef.current = new Date();
        };

        recognition.onend = () => {
          setIsListening(false);
          if (currentSession) {
            storage.current.saveSession(currentSession);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(event.error);
          
          // Auto-restart on certain errors
          if (['no-speech', 'audio-capture', 'network'].includes(event.error)) {
            setTimeout(() => {
              if (recognitionRef.current && isListening) {
                recognitionRef.current.start();
              }
            }, 1000);
          }
        };

        recognition.onresult = (event: any) => {
          const results = event.results;
          const currentIndex = event.resultIndex;

          for (let i = currentIndex; i < results.length; i++) {
            const result = results[i];
            const transcriptText = result[0].transcript;
            const isFinal = result.isFinal;

            const entry: TranscriptEntry = {
              text: transcriptText,
              timestamp: new Date(),
              startTime: beginTimeRef.current || new Date(),
              endTime: new Date(),
              confidence: result[0].confidence,
              isFinal,
              speaker: 'User', // Could be enhanced with speaker detection
            };

            setTranscript(prev => {
              // Replace interim results with final ones
              if (!isFinal) {
                const filtered = prev.filter(e => e.isFinal);
                return [...filtered, entry];
              } else {
                const filtered = prev.filter(e => e.isFinal);
                beginTimeRef.current = new Date();
                return [...filtered, entry];
              }
            });

            if (isFinal && currentSession) {
              const updatedSession = {
                ...currentSession,
                transcript: [...currentSession.transcript, entry],
                endTime: new Date(),
              };
              setCurrentSession(updatedSession);
              storage.current.saveSession(updatedSession);
            }
          }
        };

        recognitionRef.current = recognition;
      } else {
        setError('Speech recognition not supported in this browser');
      }
    }

    // Load existing sessions
    setSessions(storage.current.getAllSessions());

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, interimResults, maxAlternatives]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    // Create new session
    const newSession: CaptionSession = {
      id: `session_${Date.now()}`,
      name: `Meeting ${new Date().toLocaleString()}`,
      startTime: new Date(),
      endTime: new Date(),
      transcript: [],
      language,
    };

    setCurrentSession(newSession);
    setTranscript([]);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError('Failed to start speech recognition');
    }
  }, [language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (currentSession) {
      storage.current.saveSession(currentSession);
      setSessions(storage.current.getAllSessions());
    }
  }, [currentSession]);

  const pauseListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resumeListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error resuming recognition:', err);
      }
    }
  }, [isListening]);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        transcript: [],
      };
      setCurrentSession(updatedSession);
      storage.current.saveSession(updatedSession);
    }
  }, [currentSession]);

  const downloadTranscript = useCallback((format: 'text' | 'srt' | 'webvtt') => {
    if (!currentSession) return;

    const content = formatTranscript(currentSession.transcript, format, currentSession.startTime);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const extension = format === 'webvtt' ? 'vtt' : format;
    a.download = `transcript_${new Date().toISOString()}.${extension}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentSession]);

  const loadSession = useCallback((sessionId: string) => {
    const session = storage.current.getSession(sessionId);
    if (session) {
      setCurrentSession(session);
      setTranscript(session.transcript);
    }
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    storage.current.deleteSession(sessionId);
    setSessions(storage.current.getAllSessions());
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
      setTranscript([]);
    }
  }, [currentSession]);

  return {
    isListening,
    transcript,
    currentSession,
    error,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    clearTranscript,
    downloadTranscript,
    sessions,
    loadSession,
    deleteSession,
  };
}