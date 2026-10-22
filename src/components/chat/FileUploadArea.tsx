import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Paperclip, X, Image, FileText, File, Loader2 } from 'lucide-react';

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/avi', 'video/m4v'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
];

const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_DOC_TYPES,
];

export function FileUploadArea({ onFileSelect, isUploading, disabled }: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAndSelectFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 100MB limit');
      return;
    }
    // Allow if type matches or extension is recognized
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const safeExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg', 'm4a', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip'];
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !safeExts.includes(ext)) {
      alert('File type not supported. You can upload photos, videos, audio, PDF, Word or office files.');
      return;
    }
    onFileSelect(file);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={ALLOWED_FILE_TYPES.join(',')}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>
    </>
  );
}

interface DragDropZoneProps {
  onFileDrop: (file: File) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function DragDropZone({ onFileDrop, children, disabled }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.size > MAX_FILE_SIZE) {
        alert('File size exceeds 10MB limit');
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        alert('File type not supported. Allowed: images, PDF, Word, text files');
        return;
      }
      onFileDrop(file);
    }
  }, [disabled, onFileDrop]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative transition-colors",
        isDragging && "bg-primary/5"
      )}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
          <div className="text-center">
            <Paperclip className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium text-primary">Drop file here</p>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type) || file.type.startsWith('video/');
  const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type) || file.type.startsWith('audio/');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useState(() => {
    if (isImage || isVideo) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  });

  const getFileIcon = () => {
    if (isImage) return <Image className="h-4 w-4 text-pink-500" />;
    if (isVideo) return <Video className="h-4 w-4 text-purple-500" />;
    if (isAudio) return <FileText className="h-4 w-4 text-amber-500" />;
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-blue-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-accent/70 rounded-xl border border-border/50">
      {previewUrl && isImage ? (
        <img src={previewUrl} alt="Preview" className="h-12 w-12 object-cover rounded-lg border shadow-sm" />
      ) : previewUrl && isVideo ? (
        <video src={previewUrl} className="h-12 w-12 object-cover rounded-lg border shadow-sm" />
      ) : (
        <div className="h-12 w-12 flex items-center justify-center bg-background rounded-lg border shadow-sm">
          {getFileIcon()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
