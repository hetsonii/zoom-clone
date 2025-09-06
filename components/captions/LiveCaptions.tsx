// components/captions/LiveCaptions.tsx
'use client';

import { useState, useCallback } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Languages, Settings2, Download, Mic, MicOff } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { cn } from '@/lib/utils';
import { useCaptions } from '@/hooks/useCaptions';
import { formatTranscript } from '@/lib/captions/formatters';
import CaptionSettings from './CaptionSettings';
import CaptionDisplay from './CaptionDisplay';

const LANGUAGES = [
  { code: 'en', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  { code: 'pt-PT', label: 'Portuguese (Portugal)' },
  { code: 'ru', label: 'Russian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
  { code: 'zh-TW', label: 'Chinese (Traditional)' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'nl', label: 'Dutch' },
  { code: 'sv', label: 'Swedish' },
  { code: 'no', label: 'Norwegian' },
  { code: 'da', label: 'Danish' },
  { code: 'fi', label: 'Finnish' },
];

export default function LiveCaptions() {
  const call = useCall();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [captionSettings, setCaptionSettings] = useState({
    fontSize: 'medium',
    position: 'bottom',
    background: 'semi-transparent',
    textColor: 'white',
  });

  const {
    isListening,
    transcript,
    currentSession,
    startListening,
    stopListening,
    downloadTranscript,
    clearTranscript,
  } = useCaptions({
    language: selectedLanguage,
    continuous: true,
    interimResults: true,
  });

  const handleToggleCaptions = useCallback(() => {
    if (isEnabled) {
      stopListening();
      setIsEnabled(false);
    } else {
      startListening();
      setIsEnabled(true);
    }
  }, [isEnabled, startListening, stopListening]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    if (isListening) {
      stopListening();
      setTimeout(() => startListening(), 100);
    }
  };

  const handleDownloadTranscript = (format: 'text' | 'srt' | 'webvtt') => {
    if (currentSession) {
      downloadTranscript(format);
    }
  };

  if (!call || !localParticipant) return null;

  return (
    <>
      {/* Caption Controls Button Group */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleToggleCaptions}
          className={cn(
            "rounded-2xl px-4 py-2",
            isEnabled 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-[#19232d] hover:bg-[#4c535b]"
          )}
          title={isEnabled ? "Disable Captions" : "Enable Captions"}
        >
          {isEnabled ? (
            <Mic size={20} className="text-white" />
          ) : (
            <MicOff size={20} className="text-white" />
          )}
          <span className="ml-2 text-xs">CC</span>
        </Button>

        {isEnabled && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="rounded-2xl bg-[#19232d] px-3 py-2 hover:bg-[#4c535b]"
                  title="Select Language"
                >
                  <Languages size={20} className="text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white max-h-96 overflow-y-auto">
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={cn(
                      "cursor-pointer",
                      selectedLanguage === lang.code && "bg-[#4c535b]"
                    )}
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => setShowSettings(true)}
              className="rounded-2xl bg-[#19232d] px-3 py-2 hover:bg-[#4c535b]"
              title="Caption Settings"
            >
              <Settings2 size={20} className="text-white" />
            </Button>

            <Button
              onClick={() => setShowTranscript(true)}
              className="rounded-2xl bg-[#19232d] px-3 py-2 hover:bg-[#4c535b]"
              title="View Transcript"
            >
              <Download size={20} className="text-white" />
            </Button>
          </>
        )}
      </div>

      {/* Live Caption Display */}
      {isEnabled && (
        <CaptionDisplay
          transcript={transcript}
          settings={captionSettings}
          isListening={isListening}
        />
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-dark-1 text-white border-dark-1">
          <DialogHeader>
            <DialogTitle>Caption Settings</DialogTitle>
          </DialogHeader>
          <CaptionSettings
            settings={captionSettings}
            onSettingsChange={setCaptionSettings}
            onClose={() => setShowSettings(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Transcript Dialog */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="bg-dark-1 text-white border-dark-1 max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Meeting Transcript</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Button
                onClick={() => handleDownloadTranscript('text')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Download as Text
              </Button>
              <Button
                onClick={() => handleDownloadTranscript('srt')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Download as SRT
              </Button>
              <Button
                onClick={() => handleDownloadTranscript('webvtt')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Download as WebVTT
              </Button>
              <Button
                onClick={clearTranscript}
                className="bg-red-600 hover:bg-red-700"
              >
                Clear
              </Button>
            </div>
            <div className="bg-[#19232d] p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">
                {formatTranscript(transcript, 'text')}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}