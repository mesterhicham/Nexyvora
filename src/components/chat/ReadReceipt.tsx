import { Check, CheckCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ReadReceiptProps {
  messageCreatedAt: string;
  readers: {
    userId: string;
    fullName: string | null;
    lastReadAt: string | null;
  }[];
  isOwn: boolean;
}

export function ReadReceipt({ messageCreatedAt, readers, isOwn }: ReadReceiptProps) {
  if (!isOwn) return null;

  // Filter readers who have read this message (their last_read_at is after message created_at)
  const messageTime = new Date(messageCreatedAt).getTime();
  const readersWhoRead = readers.filter(
    (reader) => reader.lastReadAt && new Date(reader.lastReadAt).getTime() >= messageTime
  );

  const allRead = readers.length > 0 && readersWhoRead.length === readers.length;
  const someRead = readersWhoRead.length > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            "inline-flex items-center ml-1",
            allRead ? "text-blue-500" : "text-muted-foreground/70"
          )}>
            {allRead ? (
              <CheckCheck className="h-3.5 w-3.5" />
            ) : someRead ? (
              <CheckCheck className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          {readersWhoRead.length === 0 ? (
            <p>Delivered</p>
          ) : (
            <div className="space-y-1">
              <p className="font-medium">Seen by:</p>
              {readersWhoRead.map((reader) => (
                <p key={reader.userId} className="text-muted-foreground">
                  {reader.fullName || 'Unknown'} • {format(new Date(reader.lastReadAt!), 'MMM d, HH:mm')}
                </p>
              ))}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
