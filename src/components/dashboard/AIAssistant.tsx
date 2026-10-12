import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, X, Minimize2, Maximize2, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  role: UserRole;
}

import { supportService } from '@/services/apiService';
const STORAGE_KEY_PREFIX = 'ai-assistant-history-';

export function AIAssistant({ role }: AIAssistantProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load from localStorage on initial render
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${role}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${role}`, JSON.stringify(messages));
    }
  }, [messages, role]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${role}`);
    toast.success('Chat history cleared');
  }, [role]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendChatMessage = async (userMessages: Message[]) => {
    const lastUserMsg = userMessages[userMessages.length - 1];
    const history = userMessages.slice(0, -1).map(m => ({
      sender_role: m.role === 'user' ? 'user' : 'assistant',
      message: m.content,
    }));

    const response = await supportService.sendAiMessage({
      message: lastUserMsg.content,
      history,
    });

    const reply = response?.reply || response?.message || response?.content || "تمت معالجة استفسارك بنجاح.";
    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await sendChatMessage([...messages, userMessage]);
    } catch (error) {
      console.error('AI error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get AI response');
      // Remove the failed assistant message if any
      setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.content === '')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getWelcomeMessage = () => {
    switch (role) {
      case 'admin':
        return "Hello! I'm your AI assistant. I can help you manage the platform, answer questions about analytics, and assist with administrative tasks.";
      case 'teacher':
        return "Hello! I'm your AI assistant. I can help you with lesson planning, student progress tracking, and teaching strategies.";
      case 'student':
        return "Hello! I'm your AI assistant. I can help you with your studies, explain concepts, and provide learning tips.";
      default:
        return "Hello! How can I help you today?";
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 sm:bottom-6 ltr:right-4 sm:ltr:right-6 rtl:left-4 sm:rtl:left-6 z-40 h-11 w-11 sm:h-14 sm:w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        size="icon"
      >
        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-4 sm:bottom-6 ltr:right-4 sm:ltr:right-6 rtl:left-4 sm:rtl:left-6 z-50 shadow-2xl border-primary/20 transition-all duration-300",
      isMinimized ? "w-64 sm:w-72 h-14" : "w-[calc(100vw-2rem)] sm:w-96 max-w-sm h-[480px] max-h-[85vh]"
    )}>
      <CardHeader className="p-3 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Bot className="h-5 w-5 text-primary" />
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={clearHistory}
                title="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(500px-56px)]">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground">{getWelcomeMessage()}</p>
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.typeMessage')}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
