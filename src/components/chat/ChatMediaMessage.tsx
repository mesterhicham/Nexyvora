import { cn } from '@/lib/utils';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ChatMediaMessageProps {
  url: string;
  type: 'audio' | 'video' | 'image' | 'file';
  isOwn: boolean;
}

export function ChatMediaMessage({ url, type, isOwn }: ChatMediaMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAudioPlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (type === 'video') {
    return (
      <div className="max-w-xs rounded-lg overflow-hidden">
        <video
          src={url}
          controls
          className="w-full rounded-lg"
          preload="metadata"
        />
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div className={cn(
        "flex items-center gap-3 p-2 rounded-lg min-w-[200px]",
        isOwn ? "bg-primary-foreground/20" : "bg-accent"
      )}>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-10 w-10 rounded-full"
          onClick={handleAudioPlayPause}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
        <div className="flex-1">
          <div className="h-1 bg-foreground/20 rounded-full">
            <div className="h-full w-0 bg-primary rounded-full transition-all" />
          </div>
        </div>
        <Volume2 className="h-4 w-4 opacity-60" />
        <audio 
          ref={audioRef} 
          src={url} 
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className="max-w-xs rounded-lg overflow-hidden">
        <img
          src={url}
          alt="Shared image"
          className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(url, '_blank')}
        />
      </div>
    );
  }

  // File type
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg underline",
        isOwn ? "text-primary-foreground" : "text-foreground"
      )}
    >
      📎 Download attachment
    </a>
  );
}
