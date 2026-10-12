import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Video, Square, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaRecorderProps {
  type: 'audio' | 'video';
  onRecordingComplete: (blob: Blob, type: 'audio' | 'video') => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export function MediaRecorderComponent({ type, onRecordingComplete, onCancel, isUploading }: MediaRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    try {
      const constraints = type === 'video' 
        ? { video: true, audio: true }
        : { audio: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (type === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
      
      const mimeType = type === 'video' ? 'video/webm' : 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        streamRef.current?.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [type]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const handleSend = () => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob, type);
    }
  };

  const handleDiscard = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setRecordedBlob(null);
    setDuration(0);
    onCancel();
  };

  return (
    <div className="p-4 bg-accent/50 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {type === 'audio' ? (
            <Mic className="h-5 w-5 text-primary" />
          ) : (
            <Video className="h-5 w-5 text-primary" />
          )}
          <span className="font-medium capitalize">{type} Recording</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDiscard}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {type === 'video' && (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoPreviewRef}
            className="w-full h-full object-cover"
            muted={isRecording}
            playsInline
          />
          {previewUrl && !isRecording && (
            <video
              src={previewUrl}
              className="absolute inset-0 w-full h-full object-cover"
              controls
            />
          )}
        </div>
      )}

      {type === 'audio' && previewUrl && !isRecording && (
        <audio src={previewUrl} controls className="w-full" />
      )}

      <div className="flex items-center justify-center gap-4">
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-mono text-lg">{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {!previewUrl ? (
          isRecording ? (
            <Button onClick={stopRecording} variant="destructive" size="lg">
              <Square className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          ) : (
            <Button onClick={startRecording} size="lg">
              {type === 'audio' ? <Mic className="h-4 w-4 mr-2" /> : <Video className="h-4 w-4 mr-2" />}
              Start Recording
            </Button>
          )
        ) : (
          <>
            <Button variant="outline" onClick={handleDiscard} disabled={isUploading}>
              Discard
            </Button>
            <Button onClick={handleSend} disabled={isUploading}>
              {isUploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                'Send'
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
