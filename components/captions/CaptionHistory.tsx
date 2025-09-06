// components/captions/CaptionHistory.tsx
'use client';

import { useState } from 'react';
import { CaptionSession } from '@/lib/captions/types';
import { CaptionStorage } from '@/lib/captions/storage';
import { formatTranscript } from '@/lib/captions/formatters';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Trash2, Download, Eye, Calendar, Clock, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export default function CaptionHistory() {
  const [sessions, setSessions] = useState<CaptionSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<CaptionSession | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const storage = new CaptionStorage();

  useState(() => {
    setSessions(storage.getAllSessions());
  });

  const handleDelete = (sessionId: string) => {
    storage.deleteSession(sessionId);
    setSessions(storage.getAllSessions());
  };

  const handleView = (session: CaptionSession) => {
    setSelectedSession(session);
    setShowTranscript(true);
  };

  const handleDownload = (session: CaptionSession, format: 'text' | 'srt' | 'webvtt') => {
    const content = formatTranscript(session.transcript, format, session.startTime);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const extension = format === 'webvtt' ? 'vtt' : format;
    a.download = `${session.name.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const data = storage.exportSessions();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_captions_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (storage.importSessions(content)) {
        setSessions(storage.getAllSessions());
      } else {
        alert('Failed to import sessions. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Caption History</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleExportAll}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Export All
          </Button>
          <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md cursor-pointer">
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>No caption sessions found</p>
          <p className="text-sm mt-2">Start a meeting with captions enabled to see history here</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="bg-dark-2 border-dark-1 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {session.name}
                  </h3>
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(session.startTime).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(session.startTime).toLocaleTimeString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {session.transcript.length} entries
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleView(session)}
                    className="bg-[#19232d] hover:bg-[#4c535b] p-2"
                    title="View Transcript"
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    onClick={() => handleDownload(session, 'text')}
                    className="bg-[#19232d] hover:bg-[#4c535b] p-2"
                    title="Download"
                  >
                    <Download size={16} />
                  </Button>
                  <Button
                    onClick={() => handleDelete(session.id)}
                    className="bg-red-600 hover:bg-red-700 p-2"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Transcript View Dialog */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="bg-dark-1 text-white border-dark-1 max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedSession?.name}</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownload(selectedSession, 'text')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Text
                </Button>
                <Button
                  onClick={() => handleDownload(selectedSession, 'srt')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  SRT
                </Button>
                <Button
                  onClick={() => handleDownload(selectedSession, 'webvtt')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  WebVTT
                </Button>
              </div>
              <div className="bg-[#19232d] p-4 rounded-lg max-h-[60vh] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">
                  {formatTranscript(selectedSession.transcript, 'text')}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}