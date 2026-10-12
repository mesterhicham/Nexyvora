import { useState } from 'react';
import { Pencil, Trash2, MoreVertical, X, Check, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface MessageActionsProps {
  messageId: string;
  content: string;
  isOwn: boolean;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onReply: (messageId: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}

export function MessageActions({
  messageId,
  content,
  isOwn,
  onEdit,
  onDelete,
  onReply,
  isEditing,
  onStartEdit,
  onCancelEdit,
}: MessageActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
              isOwn 
                ? "absolute -right-8 top-1/2 -translate-y-1/2" 
                : "absolute -left-8 top-1/2 -translate-y-1/2"
            )}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isOwn ? "end" : "start"} className="bg-popover">
          <DropdownMenuItem onClick={() => onReply(messageId)}>
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </DropdownMenuItem>
          {isOwn && (
            <>
              <DropdownMenuItem onClick={onStartEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This message will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(messageId);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface EditMessageInputProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EditMessageInput({ initialContent, onSave, onCancel, isLoading }: EditMessageInputProps) {
  const [content, setContent] = useState(initialContent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && content !== initialContent) {
      onSave(content.trim());
    } else {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1 mt-1">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="h-7 text-sm"
        autoFocus
        disabled={isLoading}
      />
      <Button type="submit" size="icon" variant="ghost" className="h-7 w-7" disabled={isLoading}>
        <Check className="h-3.5 w-3.5 text-green-500" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={onCancel} disabled={isLoading}>
        <X className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </form>
  );
}
