import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useSearchMessages, Message } from '@/hooks/useChat';

interface MessageSearchProps {
  conversationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMessage: (messageId: string) => void;
}

export function MessageSearch({ 
  conversationId, 
  isOpen, 
  onClose, 
  onNavigateToMessage 
}: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: searchResults, isLoading } = useSearchMessages(conversationId, searchQuery);
  
  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Reset when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);
  
  // Navigate through results
  const navigatePrev = () => {
    if (searchResults && searchResults.length > 0) {
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : searchResults.length - 1;
      setSelectedIndex(newIndex);
      onNavigateToMessage(searchResults[newIndex].id);
    }
  };
  
  const navigateNext = () => {
    if (searchResults && searchResults.length > 0) {
      const newIndex = selectedIndex < searchResults.length - 1 ? selectedIndex + 1 : 0;
      setSelectedIndex(newIndex);
      onNavigateToMessage(searchResults[newIndex].id);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults && searchResults.length > 0) {
      onNavigateToMessage(searchResults[selectedIndex].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigatePrev();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateNext();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2 p-2">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="h-8 border-0 focus-visible:ring-0 px-0"
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {searchResults && searchResults.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <span>{selectedIndex + 1}/{searchResults.length}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={navigatePrev}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={navigateNext}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Search Results Preview */}
      {searchQuery.trim().length >= 2 && (
        <div className="border-t">
          {searchResults && searchResults.length > 0 ? (
            <ScrollArea className="max-h-48">
              <div className="p-1">
                {searchResults.map((message, index) => (
                  <button
                    key={message.id}
                    onClick={() => {
                      setSelectedIndex(index);
                      onNavigateToMessage(message.id);
                    }}
                    className={cn(
                      "w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors",
                      index === selectedIndex 
                        ? "bg-primary/10" 
                        : "hover:bg-accent"
                    )}
                  >
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={message.sender?.avatar_url || ''} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(message.sender?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate">
                          {message.sender?.full_name || message.sender?.email}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {format(new Date(message.created_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {highlightMatch(message.content, searchQuery)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : !isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No messages found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}