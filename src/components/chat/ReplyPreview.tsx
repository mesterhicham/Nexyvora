import { X, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReplyPreviewProps {
  replyTo: {
    id: string;
    content: string;
    senderName: string | null;
  };
  onCancel: () => void;
  variant?: 'input' | 'message';
  isOwn?: boolean;
}

export function ReplyPreview({ replyTo, onCancel, variant = 'input', isOwn = false }: ReplyPreviewProps) {
  if (variant === 'message') {
    // Display for a message that is a reply
    return (
      <div 
        className={cn(
          "flex items-start gap-2 text-xs px-2 py-1.5 rounded mb-1.5 border-l-2",
          isOwn 
            ? "bg-primary-foreground/10 border-primary-foreground/40" 
            : "bg-accent/50 border-primary/40"
        )}
      >
        <Reply className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-60" />
        <div className="min-w-0 flex-1">
          <p className={cn(
            "font-medium truncate",
            isOwn ? "text-primary-foreground/80" : "text-foreground/80"
          )}>
            {replyTo.senderName || 'Unknown'}
          </p>
          <p className={cn(
            "truncate",
            isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
          )}>
            {replyTo.content}
          </p>
        </div>
      </div>
    );
  }

  // Display for input area when composing a reply
  return (
    <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg border-l-2 border-primary">
      <Reply className="h-4 w-4 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary">
          Replying to {replyTo.senderName || 'Unknown'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {replyTo.content}
        </p>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 flex-shrink-0" 
        onClick={onCancel}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}