import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, Download, Maximize2, FileText, Music, Film, ExternalLink } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ChatMediaMessageProps {
  url: string;
  type: 'audio' | 'video' | 'image' | 'file';
  isOwn: boolean;
}

export function ChatMediaMessage({ url, type, isOwn }: ChatMediaMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url]);

  const handleAudioPlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => console.error('Audio play error:', err));
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(pos * duration, duration));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !Number.isFinite(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  // Video Media Message
  if (type === 'video') {
    return (
      <div className="rounded-2xl overflow-hidden max-w-[320px] sm:max-w-sm bg-black/80 border border-black/20 shadow-md">
        <video
          src={url}
          controls
          className="w-full max-h-[360px] object-contain rounded-2xl"
          preload="metadata"
          playsInline
        />
        <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 text-[11px] text-white/80">
          <span className="flex items-center gap-1">
            <Film className="w-3.5 h-3.5 text-purple-400" />
            فيديو / Video
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            تحميل
          </a>
        </div>
      </div>
    );
  }

  // Audio / Voice Note Message (Instagram / WhatsApp Voice Note Player)
  if (type === 'audio') {
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-2xl min-w-[240px] max-w-[320px] shadow-sm transition-all",
          isOwn
            ? "bg-white/15 text-white backdrop-blur-sm border border-white/20"
            : "bg-background text-foreground border border-border shadow-sm"
        )}
      >
        <button
          type="button"
          onClick={handleAudioPlayPause}
          className={cn(
            "h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md",
            isOwn
              ? "bg-white text-purple-700 hover:bg-white/90"
              : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white hover:opacity-95"
          )}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Audio Waveform / Progress Bar */}
          <div
            onClick={handleSeek}
            className="h-5 flex items-center gap-[2px] cursor-pointer group py-1"
            title="Click to seek"
          >
            {[40, 70, 30, 90, 60, 100, 45, 80, 65, 90, 50, 75, 95, 40, 60, 85, 30, 70, 90, 50].map((height, i) => {
              const barPercent = (i / 20) * 100;
              const isPassed = progressPercent >= barPercent;
              return (
                <div
                  key={i}
                  style={{ height: `${height}%` }}
                  className={cn(
                    "flex-1 rounded-full transition-all duration-150",
                    isPassed
                      ? (isOwn ? "bg-white" : "bg-purple-600 dark:bg-purple-400")
                      : (isOwn ? "bg-white/30" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"),
                    isPlaying && isPassed && "animate-pulse"
                  )}
                />
              );
            })}
          </div>

          {/* Time & Duration */}
          <div className="flex items-center justify-between text-[11px] opacity-80 select-none">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <audio ref={audioRef} src={url} preload="metadata" className="hidden" />
      </div>
    );
  }

  // Image Message
  if (type === 'image') {
    return (
      <>
        <div className="relative group max-w-[280px] sm:max-w-xs rounded-2xl overflow-hidden border border-border/40 shadow-sm bg-muted/20">
          <img
            src={url}
            alt="Shared image"
            loading="lazy"
            className="w-full max-h-[340px] object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-200 rounded-2xl"
            onClick={() => setIsLightboxOpen(true)}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
            <span className="p-2 bg-black/60 rounded-full text-white backdrop-blur-sm pointer-events-auto cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
              <Maximize2 className="w-4 h-4" />
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="p-2 bg-black/60 rounded-full text-white backdrop-blur-sm pointer-events-auto hover:bg-black/80"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Image Lightbox Modal */}
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="max-w-4xl p-2 bg-black/95 border-none text-white flex flex-col items-center">
            <div className="w-full flex justify-end gap-2 p-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 text-xs"
              >
                <Download className="w-4 h-4" /> تحميل الصورة
              </a>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 text-xs"
              >
                <ExternalLink className="w-4 h-4" /> فتح الرابط
              </a>
            </div>
            <img
              src={url}
              alt="Full Preview"
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Document / Generic File Attachment
  const fileName = url.split('/').pop() || 'مستند مرفق';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download
      className={cn(
        "flex items-center gap-3 p-3 rounded-2xl transition-all group max-w-xs shadow-sm",
        isOwn
          ? "bg-white/15 text-white hover:bg-white/20 border border-white/20"
          : "bg-card text-card-foreground hover:bg-accent border border-border"
      )}
    >
      <div className={cn(
        "p-2.5 rounded-xl shrink-0",
        isOwn ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
      )}>
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate group-hover:underline">
          {decodeURIComponent(fileName)}
        </p>
        <span className="text-[11px] opacity-70 flex items-center gap-1">
          <Download className="w-3 h-3" /> تحميل الملف
        </span>
      </div>
    </a>
  );
}
