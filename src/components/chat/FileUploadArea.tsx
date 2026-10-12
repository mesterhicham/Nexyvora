import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Paperclip, X, Image, FileText, File, Loader2 } from 'lucide-react';

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export function FileUploadArea({ onFileSelect, isUploading, disabled }: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAndSelectFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 10MB limit');
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('File type not supported. Allowed: images, PDF, Word, text files');
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate preview for images
  useState(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  });

  const getFileIcon = () => {
    if (isImage) return <Image className="h-4 w-4" />;
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-accent/50 rounded-lg">
      {previewUrl ? (
        <img src={previewUrl} alt="Preview" className="h-10 w-10 object-cover rounded" />
      ) : (
        <div className="h-10 w-10 flex items-center justify-center bg-accent rounded">
          {getFileIcon()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
