// lib/captions/types.ts

export interface TranscriptEntry {
  text: string;
  timestamp: Date;
  startTime: Date;
  endTime: Date;
  confidence?: number;
  isFinal: boolean;
  speaker?: string;
}

export interface CaptionSession {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  transcript: TranscriptEntry[];
  language: string;
}

export interface CaptionSettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  position: 'top' | 'middle' | 'bottom';
  background: 'transparent' | 'semi-transparent' | 'solid';
  textColor: 'white' | 'yellow' | 'green' | 'cyan';
  fontFamily?: string;
  lineHeight?: number;
  maxLines?: number;
  displayDuration?: number; // in seconds
}

export interface RecognitionError {
  error: string;
  message: string;
  timestamp: Date;
}

export interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Extended Window interface for TypeScript
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}