// lib/captions/formatters.ts

import { TranscriptEntry } from './types';

export function formatTranscript(
  transcript: TranscriptEntry[],
  format: 'text' | 'srt' | 'webvtt',
  sessionStartTime?: Date
): string {
  switch (format) {
    case 'text':
      return formatAsText(transcript);
    case 'srt':
      return formatAsSRT(transcript, sessionStartTime);
    case 'webvtt':
      return formatAsWebVTT(transcript, sessionStartTime);
    default:
      return formatAsText(transcript);
  }
}

function formatAsText(transcript: TranscriptEntry[]): string {
  return transcript
    .filter(entry => entry.isFinal)
    .map(entry => {
      const time = entry.timestamp.toLocaleTimeString();
      const speaker = entry.speaker || 'Unknown';
      return `[${time}] ${speaker}: ${entry.text}`;
    })
    .join('\n\n');
}

function formatAsSRT(transcript: TranscriptEntry[], sessionStartTime?: Date): string {
  const startTime = sessionStartTime || (transcript[0]?.startTime || new Date());
  let output = '';
  let counter = 1;

  transcript
    .filter(entry => entry.isFinal)
    .forEach(entry => {
      output += `${counter}\n`;
      output += `${formatTimecodeSRT(entry.startTime, startTime)} --> ${formatTimecodeSRT(entry.endTime, startTime)}\n`;
      output += `${entry.text}\n\n`;
      counter++;
    });

  return output;
}

function formatAsWebVTT(transcript: TranscriptEntry[], sessionStartTime?: Date): string {
  const startTime = sessionStartTime || (transcript[0]?.startTime || new Date());
  let output = 'WEBVTT\n\n';

  transcript
    .filter(entry => entry.isFinal)
    .forEach((entry, index) => {
      output += `${index + 1}\n`;
      output += `${formatTimecodeVTT(entry.startTime, startTime)} --> ${formatTimecodeVTT(entry.endTime, startTime)}\n`;
      output += `${entry.text}\n\n`;
    });

  return output;
}

function formatTimecodeSRT(time: Date, startTime: Date): string {
  const elapsed = time.getTime() - startTime.getTime();
  return formatMillisecondsToTimecode(elapsed, ',');
}

function formatTimecodeVTT(time: Date, startTime: Date): string {
  const elapsed = time.getTime() - startTime.getTime();
  return formatMillisecondsToTimecode(elapsed, '.');
}

function formatMillisecondsToTimecode(ms: number, separator: string): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const displayHours = hours.toString().padStart(2, '0');
  const displayMinutes = (minutes % 60).toString().padStart(2, '0');
  const displaySeconds = (seconds % 60).toString().padStart(2, '0');
  const displayMs = (ms % 1000).toString().padStart(3, '0');

  return `${displayHours}:${displayMinutes}:${displaySeconds}${separator}${displayMs}`;
}

// Advanced formatting options
export function formatTranscriptWithSpeakers(transcript: TranscriptEntry[]): string {
  const speakers = new Set(transcript.map(e => e.speaker || 'Unknown'));
  let output = `Participants: ${Array.from(speakers).join(', ')}\n\n`;
  
  let currentSpeaker = '';
  
  transcript
    .filter(entry => entry.isFinal)
    .forEach(entry => {
      const speaker = entry.speaker || 'Unknown';
      if (speaker !== currentSpeaker) {
        output += `\n${speaker}:\n`;
        currentSpeaker = speaker;
      }
      output += `${entry.text} `;
    });

  return output;
}

export function formatTranscriptAsJSON(transcript: TranscriptEntry[]): string {
  const data = transcript.filter(entry => entry.isFinal).map(entry => ({
    text: entry.text,
    speaker: entry.speaker || 'Unknown',
    timestamp: entry.timestamp.toISOString(),
    startTime: entry.startTime.toISOString(),
    endTime: entry.endTime.toISOString(),
    confidence: entry.confidence,
  }));

  return JSON.stringify(data, null, 2);
}

export function formatTranscriptAsMarkdown(transcript: TranscriptEntry[]): string {
  let output = '# Meeting Transcript\n\n';
  output += `**Date:** ${new Date().toLocaleDateString()}\n\n`;
  output += `**Time:** ${new Date().toLocaleTimeString()}\n\n`;
  output += '---\n\n';

  let currentSpeaker = '';
  
  transcript
    .filter(entry => entry.isFinal)
    .forEach(entry => {
      const speaker = entry.speaker || 'Unknown';
      const time = entry.timestamp.toLocaleTimeString();
      
      if (speaker !== currentSpeaker) {
        output += `\n### ${speaker}\n\n`;
        currentSpeaker = speaker;
      }
      
      output += `> [${time}] ${entry.text}\n\n`;
    });

  return output;
}

// Utility function to clean up transcript text
export function cleanTranscriptText(text: string): string {
  // Capitalize first letter
  text = text.charAt(0).toUpperCase() + text.slice(1);
  
  // Add punctuation if missing
  if (!/[.!?]$/.test(text)) {
    text += '.';
  }
  
  // Fix common transcription errors
  text = text.replace(/\bi\b/g, 'I');
  text = text.replace(/\s+/g, ' ');
  
  return text.trim();
}