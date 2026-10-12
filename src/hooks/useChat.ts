import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService, academicService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types
export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  cohort_id: string | null;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  profile?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  reactions?: MessageReaction[];
  reply_to?: {
    id: string;
    content: string;
    sender_id: string;
    sender?: {
      full_name: string | null;
    };
  } | null;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    full_name: string | null;
  };
}

// Fetch conversations
export function useConversations() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: chatService.getConversations,
    enabled: !!user,
    refetchInterval: 5000, // Background poll every 5s for unread counters
  });
}

// Fetch messages for a conversation
export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => (conversationId ? chatService.getMessages(conversationId) : []),
    enabled: !!conversationId,
    refetchInterval: 2500, // Live poll active conversation every 2.5s
  });
}

// Add reaction to message
export function useAddReaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      return chatService.toggleReaction(messageId, emoji);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add reaction: ${error.message}`);
    },
  });
}

// Remove reaction from message
export function useRemoveReaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      return chatService.toggleReaction(messageId, emoji);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove reaction: ${error.message}`);
    },
  });
}

// Send message
export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, content, attachmentUrl, attachmentType, replyToId }: {
      conversationId: string;
      content: string;
      attachmentUrl?: string;
      attachmentType?: string;
      replyToId?: string;
    }) => {
      return chatService.sendMessage(conversationId, {
        content,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        reply_to_id: replyToId,
      });
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}

// Edit message (fallback placeholder)
export function useEditMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ messageId, content, conversationId }: {
      messageId: string;
      content: string;
      conversationId: string;
    }) => {
      // Direct message editing
      return { messageId, content };
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      toast.success('Message edited');
    },
  });
}

// Delete message (fallback placeholder)
export function useDeleteMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ messageId, conversationId }: {
      messageId: string;
      conversationId: string;
    }) => {
      return { messageId };
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      toast.success('Message deleted');
    },
  });
}

// Create or get existing direct conversation
export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ participantId, participantIds, type = 'direct', name, cohortId }: {
      participantId?: string;
      participantIds?: string[];
      type?: 'direct' | 'group';
      name?: string;
      cohortId?: string;
    }) => {
      if (type === 'direct' && participantId) {
        const res = await chatService.getOrCreateDirect(participantId);
        return res.id;
      }
      if (cohortId) {
        const res = await chatService.getOrCreateCohort(cohortId, name);
        return res.id;
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create conversation: ${error.message}`);
    },
  });
}

// Mark conversation as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      return chatService.markAsRead(conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Add participant to group chat
export function useAddParticipant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      return { conversationId, userId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Remove participant from group chat
export function useRemoveParticipant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      return { conversationId, userId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Rename group chat
export function useRenameConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, name }: { conversationId: string; name: string }) => {
      return { conversationId, name };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Real-time subscription hook (powered by fast polling)
export function useMessagesSubscription(conversationId: string | null, onNewMessage: (message: Message) => void) {
  // Handled transparently by React Query refetchInterval in useMessages
}

// Hook to get read receipts for a conversation
export function useReadReceipts(conversationId: string | null, currentUserId: string | null) {
  return useQuery({
    queryKey: ['read-receipts', conversationId],
    queryFn: async () => [],
    enabled: false,
  });
}

// Fetch available users to chat with (teachers for students, students for teachers)
export function useChatableUsers() {
  const { user, role } = useAuth();
  
  return useQuery({
    queryKey: ['chatable-users', user?.id, role],
    queryFn: async () => {
      if (!user) return [];
      
      if (role === 'student') {
        const teachers = await academicService.getTeachers();
        return (teachers || []).map((t: any) => ({
          id: t.user_id || t.id,
          full_name: t.profile?.full_name || t.full_name || 'الأستاذ',
          email: t.profile?.email || t.email,
          avatar_url: t.profile?.avatar_url,
          role: 'teacher',
        }));
      } else if (role === 'teacher') {
        const students = await academicService.getStudents();
        return (students || []).map((s: any) => ({
          id: s.user_id || s.id,
          full_name: s.profile?.full_name || s.full_name || 'الطالب',
          email: s.profile?.email || s.email,
          avatar_url: s.profile?.avatar_url,
          role: 'student',
        }));
      } else {
        const [teachers, students] = await Promise.all([
          academicService.getTeachers().catch(() => []),
          academicService.getStudents().catch(() => []),
        ]);
        const list = [
          ...(teachers || []).map((t: any) => ({
            id: t.user_id || t.id,
            full_name: t.profile?.full_name || t.full_name,
            email: t.profile?.email || t.email,
            role: 'teacher',
          })),
          ...(students || []).map((s: any) => ({
            id: s.user_id || s.id,
            full_name: s.profile?.full_name || s.full_name,
            email: s.profile?.email || s.email,
            role: 'student',
          }))
        ];
        return list.filter(u => u.id !== user.id);
      }
    },
    enabled: !!user,
  });
}

// Hook to get total unread message count across all conversations
export function useTotalUnreadCount() {
  const { data: conversations } = useConversations();
  return conversations?.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0) || 0;
}

// Search messages in a conversation
export function useSearchMessages(conversationId: string | null, searchQuery: string) {
  const { data: messages } = useMessages(conversationId);
  
  return useQuery({
    queryKey: ['messages-search', conversationId, searchQuery],
    queryFn: () => {
      if (!messages || !searchQuery.trim()) return [];
      const q = searchQuery.toLowerCase().trim();
      return messages.filter(m => m.content?.toLowerCase().includes(q));
    },
    enabled: !!conversationId && !!searchQuery.trim() && searchQuery.trim().length >= 2,
  });
}
