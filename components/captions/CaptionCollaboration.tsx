// components/captions/CaptionCollaboration.tsx
'use client';

import { useEffect, useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Button } from '../ui/button';
import { Share2, Users, Copy, Check } from 'lucide-react';
import { TranscriptEntry } from '@/lib/captions/types';

interface CaptionCollaborationProps {
  transcript: TranscriptEntry[];
  sessionId: string;
}

export default function CaptionCollaboration({ 
  transcript, 
  sessionId 
}: CaptionCollaborationProps) {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  
  const [isSharing, setIsSharing] = useState(false);
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Broadcast caption updates to other participants
  useEffect(() => {
    if (!call || !isSharing) return;

    const latestEntry = transcript[transcript.length - 1];
    if (latestEntry && latestEntry.isFinal) {
      // Send custom event to other participants
      call.sendCustomEvent({
        type: 'caption-update',
        data: {
          sessionId,
          entry: latestEntry,
          sender: call.currentUserId,
        },
      });
    }
  }, [transcript, call, isSharing, sessionId]);

  // Listen for caption updates from others
  useEffect(() => {
    if (!call) return;

    const handleCustomEvent = (event: any) => {
      if (event.type === 'caption-update') {
        // Handle incoming captions from other participants
        console.log('Received caption:', event.data);
        // You could update a shared transcript view here
      }
    };

    call.on('custom', handleCustomEvent);
    return () => {
      call.off('custom', handleCustomEvent);
    };
  }, [call]);

  const handleShareCaptions = () => {
    setIsSharing(!isSharing);
    if (!isSharing && call) {
      // Notify others that captions are being shared
      call.sendCustomEvent({
        type: 'caption-sharing-started',
        data: {
          sessionId,
          userId: call.currentUserId,
        },
      });
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/captions/shared/${sessionId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleShareCaptions}
        className={`rounded-2xl px-3 py-2 ${
          isSharing 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-[#19232d] hover:bg-[#4c535b]'
        }`}
        title="Share Captions"
      >
        <Share2 size={16} className="mr-1" />
        {isSharing ? 'Sharing' : 'Share'}
      </Button>

      {isSharing && (
        <>
          <div className="flex items-center gap-1 px-2 py-1 bg-[#19232d] rounded-lg">
            <Users size={14} />
            <span className="text-xs">{participants.length - 1}</span>
          </div>
          
          <Button
            onClick={copyShareLink}
            className="rounded-2xl px-3 py-2 bg-[#19232d] hover:bg-[#4c535b]"
            title="Copy Share Link"
          >
            {copied ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Copy size={16} />
            )}
          </Button>
        </>
      )}
    </div>
  );
}