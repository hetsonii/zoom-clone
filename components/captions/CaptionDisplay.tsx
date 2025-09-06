// components/captions/CaptionDisplay.tsx
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TranscriptEntry } from '@/lib/captions/types';

interface CaptionDisplayProps {
  transcript: TranscriptEntry[];
  settings: {
    fontSize: string;
    position: string;
    background: string;
    textColor: string;
  };
  isListening: boolean;
}

export default function CaptionDisplay({
  transcript,
  settings,
  isListening,
}: CaptionDisplayProps) {
  const [currentCaption, setCurrentCaption] = useState('');
  const [interimCaption, setInterimCaption] = useState('');

  useEffect(() => {
    if (transcript.length > 0) {
      const lastEntry = transcript[transcript.length - 1];
      if (lastEntry.isFinal) {
        setCurrentCaption(lastEntry.text);
        setInterimCaption('');
        // Clear caption after 5 seconds
        const timer = setTimeout(() => {
          setCurrentCaption('');
        }, 5000);
        return () => clearTimeout(timer);
      } else {
        setInterimCaption(lastEntry.text);
      }
    }
  }, [transcript]);

  const getPositionClasses = () => {
    switch (settings.position) {
      case 'top':
        return 'top-20 left-1/2 -translate-x-1/2';
      case 'middle':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        return 'bottom-24 left-1/2 -translate-x-1/2';
    }
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-xl';
      case 'extra-large':
        return 'text-2xl';
      case 'medium':
      default:
        return 'text-base';
    }
  };

  const getBackgroundClass = () => {
    switch (settings.background) {
      case 'solid':
        return 'bg-black';
      case 'transparent':
        return 'bg-transparent';
      case 'semi-transparent':
      default:
        return 'bg-black/70';
    }
  };

  const getTextColorClass = () => {
    switch (settings.textColor) {
      case 'yellow':
        return 'text-yellow-400';
      case 'green':
        return 'text-green-400';
      case 'cyan':
        return 'text-cyan-400';
      case 'white':
      default:
        return 'text-white';
    }
  };

  const displayText = interimCaption || currentCaption;

  if (!displayText && !isListening) return null;

  return (
    <div
      className={cn(
        'fixed z-50 px-6 py-3 rounded-lg max-w-[80%] text-center transition-all duration-200',
        getPositionClasses(),
        getBackgroundClass(),
        getFontSizeClass(),
        getTextColorClass(),
        displayText ? 'opacity-100' : 'opacity-0'
      )}
    >
      {isListening && !displayText && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="animate-pulse">●</span>
            <span className="animate-pulse animation-delay-200">●</span>
            <span className="animate-pulse animation-delay-400">●</span>
          </div>
          <span className="text-sm opacity-70">Listening...</span>
        </div>
      )}
      {displayText && (
        <p className={cn(
          'font-medium leading-relaxed',
          interimCaption && 'italic opacity-80'
        )}>
          {displayText}
        </p>
      )}
    </div>
  );
}