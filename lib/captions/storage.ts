// lib/captions/storage.ts

import { CaptionSession } from './types';

export class CaptionStorage {
  private STORAGE_KEY = 'meeting_captions';
  private SESSION_PREFIX = 'caption_session_';

  constructor() {
    // Initialize storage if needed
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') return;
    
    const existingSessions = this.getAllSessions();
    if (!existingSessions) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }
  }

  getAllSessions(): CaptionSession[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const sessions = localStorage.getItem(this.STORAGE_KEY);
      if (!sessions) return [];
      
      const parsed = JSON.parse(sessions);
      // Convert date strings back to Date objects
      return parsed.map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: new Date(session.endTime),
        transcript: session.transcript.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
          startTime: new Date(entry.startTime),
          endTime: new Date(entry.endTime),
        })),
      }));
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  getSession(sessionId: string): CaptionSession | null {
    const sessions = this.getAllSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  saveSession(session: CaptionSession) {
    if (typeof window === 'undefined') return;
    
    try {
      const sessions = this.getAllSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
      
      // Also save individual session for quick access
      localStorage.setItem(
        `${this.SESSION_PREFIX}${session.id}`,
        JSON.stringify(session)
      );
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  deleteSession(sessionId: string) {
    if (typeof window === 'undefined') return;
    
    try {
      const sessions = this.getAllSessions();
      const filtered = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      
      // Remove individual session storage
      localStorage.removeItem(`${this.SESSION_PREFIX}${sessionId}`);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  clearAllSessions() {
    if (typeof window === 'undefined') return;
    
    try {
      // Get all session IDs first
      const sessions = this.getAllSessions();
      
      // Remove individual session storage
      sessions.forEach(session => {
        localStorage.removeItem(`${this.SESSION_PREFIX}${session.id}`);
      });
      
      // Clear the main sessions list
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing sessions:', error);
    }
  }

  exportSessions(): string {
    const sessions = this.getAllSessions();
    return JSON.stringify(sessions, null, 2);
  }

  importSessions(jsonString: string): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const sessions = JSON.parse(jsonString);
      
      // Validate the structure
      if (!Array.isArray(sessions)) {
        throw new Error('Invalid sessions format');
      }
      
      // Save each session
      sessions.forEach((session: CaptionSession) => {
        this.saveSession(session);
      });
      
      return true;
    } catch (error) {
      console.error('Error importing sessions:', error);
      return false;
    }
  }

  // Get storage size in bytes
  getStorageSize(): number {
    if (typeof window === 'undefined') return 0;
    
    let size = 0;
    const sessions = this.getAllSessions();
    size += JSON.stringify(sessions).length;
    
    sessions.forEach(session => {
      const sessionData = localStorage.getItem(`${this.SESSION_PREFIX}${session.id}`);
      if (sessionData) {
        size += sessionData.length;
      }
    });
    
    return size;
  }

  // Check if storage is near limit (5MB typical limit)
  isStorageNearLimit(): boolean {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const currentSize = this.getStorageSize();
    return currentSize > MAX_SIZE * 0.9; // 90% of limit
  }
}