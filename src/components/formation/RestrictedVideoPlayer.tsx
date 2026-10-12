import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RestrictedVideoPlayerProps {
  src: string;
  title: string;
  duration?: number;
  onProgress?: (watchedSeconds: number) => void;
  onComplete?: () => void;
  isLocked?: boolean;
  initialProgress?: number;
}

export function RestrictedVideoPlayer({
  src,
  title,
  duration,
  onProgress,
  onComplete,
  isLocked = false,
  initialProgress = 0,
}: RestrictedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialProgress);
  const [videoDuration, setVideoDuration] = useState(duration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [maxWatched, setMaxWatched] = useState(initialProgress);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeout = useRef<NodeJS.Timeout>();

  // Prevent speed changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const preventSpeedChange = () => {
      if (video.playbackRate !== 1) {
        video.playbackRate = 1;
      }
    };

    video.addEventListener('ratechange', preventSpeedChange);
    return () => video.removeEventListener('ratechange', preventSpeedChange);
  }, []);

  // Handle seeking - only allow rewind
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const current = video.currentTime;
    setCurrentTime(current);

    // Update max watched
    if (current > maxWatched) {
      setMaxWatched(current);
      onProgress?.(Math.floor(current));
    }

    // Check completion (95% watched)
    if (videoDuration > 0 && current >= videoDuration * 0.95) {
      onComplete?.();
    }
  }, [maxWatched, videoDuration, onProgress, onComplete]);

  // Prevent seeking forward past maxWatched
  const handleSeeking = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.currentTime > maxWatched + 1) {
      video.currentTime = maxWatched;
    }
  }, [maxWatched]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeeking);
    };
  }, [handleTimeUpdate, handleSeeking]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      if (initialProgress > 0) {
        videoRef.current.currentTime = initialProgress;
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current || isLocked) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const rewind10 = () => {
    if (!videoRef.current || isLocked) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const progressPercent = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  if (isLocked) {
    return (
      <div className="relative aspect-video bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Video Locked</p>
          <p className="text-sm text-muted-foreground">Complete the previous video to unlock</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        playsInline
      />

      {/* Overlay Controls */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Center Play Button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="lg"
              variant="ghost"
              className="h-20 w-20 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground"
              onClick={togglePlay}
            >
              <Play className="h-10 w-10" />
            </Button>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <div className="flex items-center gap-2 text-white text-sm">
            <span>{formatTime(currentTime)}</span>
            <div className="flex-1">
              <Progress value={progressPercent} className="h-1" />
            </div>
            <span>{formatTime(videoDuration)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={rewind10}
                title="Rewind 10 seconds"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                1x (Speed locked)
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <h3 className="text-white font-medium truncate">{title}</h3>
      </div>
    </div>
  );
}
