import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatService } from '@/services/apiService';

interface TypingUser {
  user_id: string;
  full_name: string | null;
}

interface TypingIndicatorProps {
  conversationId: string;
  currentUserId: string;
}

export const TypingIndicator = ({ conversationId, currentUserId }: TypingIndicatorProps) => {
  const { data: typingUsers = [] } = useQuery({
    queryKey: ['typing-indicators', conversationId],
    queryFn: () => chatService.getTyping(conversationId),
    refetchInterval: 3000,
    enabled: !!conversationId,
  });

  if (!typingUsers || typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].full_name || 'Someone'} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].full_name || 'Someone'} and ${typingUsers[1].full_name || 'someone'} are typing`;
    } else {
      return `${typingUsers.length} people are typing`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
};

// Hook to manage typing status
export const useTypingIndicator = (conversationId: string | null, userId: string | null) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeoutState] = useState<NodeJS.Timeout | null>(null);

  const startTyping = async () => {
    if (!conversationId || !userId) return;
    try {
      await chatService.setTyping(conversationId, true);
      setIsTyping(true);
    } catch {
      // Ignore
    }
  };

  const stopTyping = async () => {
    if (!conversationId || !userId) return;
    try {
      await chatService.setTyping(conversationId, false);
      setIsTyping(false);
    } catch {
      // Ignore
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      startTyping();
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      stopTyping();
    }, 3000);
    setTypingTimeoutState(timeout);
  };

  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      if (isTyping && conversationId && userId) {
        chatService.setTyping(conversationId, false).catch(() => {});
      }
    };
  }, [conversationId, userId, isTyping, typingTimeout]);

  return { handleTyping, stopTyping };
};
