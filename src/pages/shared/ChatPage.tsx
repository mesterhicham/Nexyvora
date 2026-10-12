import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useConversations, 
  useMessages, 
  useSendMessage, 
  useCreateConversation,
  useMarkAsRead,
  useMessagesSubscription,
  useChatableUsers,
  useAddParticipant,
  useRemoveParticipant,
  useRenameConversation,
  useAddReaction,
  useRemoveReaction,
  useReadReceipts,
  useEditMessage,
  useDeleteMessage,
  useSearchMessages,
  Message,
} from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { uploadService } from '@/services/apiService';
import { MessageSquare, Send, Plus, Users, Loader2, Search, Mic, Video, User, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { MediaRecorderComponent } from '@/components/chat/MediaRecorder';
import { ChatMediaMessage } from '@/components/chat/ChatMediaMessage';
import { CreateGroupChat } from '@/components/chat/CreateGroupChat';
import { ManageGroupParticipants } from '@/components/chat/ManageGroupParticipants';
import { FileUploadArea, DragDropZone, FilePreview } from '@/components/chat/FileUploadArea';
import { TypingIndicator, useTypingIndicator } from '@/components/chat/TypingIndicator';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { ReadReceipt } from '@/components/chat/ReadReceipt';
import { MessageActions, EditMessageInput } from '@/components/chat/MessageActions';
import { ReplyPreview } from '@/components/chat/ReplyPreview';
import { MessageSearch } from '@/components/chat/MessageSearch';

export default function ChatPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const userRole = role || 'student';
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isManageParticipantsOpen, setIsManageParticipantsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    content: string;
    senderName: string | null;
  } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const { data: messages, isLoading: loadingMessages } = useMessages(selectedConversationId);
  const { data: chatableUsers, isLoading: loadingUsers } = useChatableUsers();
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();
  const markAsRead = useMarkAsRead();
  const addParticipant = useAddParticipant();
  const removeParticipant = useRemoveParticipant();
  const renameConversation = useRenameConversation();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const { handleTyping, stopTyping } = useTypingIndicator(selectedConversationId, user?.id || null);
  const { data: readReceipts } = useReadReceipts(selectedConversationId, user?.id || null);
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  
  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);
  
  // Real-time messages
  const handleNewMessage = useCallback((message: Message) => {
    // Scroll to bottom when new message arrives
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);
  
  useMessagesSubscription(selectedConversationId, handleNewMessage);
  
  // Scroll to bottom when messages load or change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Mark as read when opening conversation
  useEffect(() => {
    if (selectedConversationId) {
      markAsRead.mutate(selectedConversationId);
    }
  }, [selectedConversationId]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedFile) || !selectedConversationId) return;
    
    // If there's a file, upload it first
    if (selectedFile) {
      await handleFileUpload(selectedFile);
      return;
    }
    
    await sendMessage.mutateAsync({
      conversationId: selectedConversationId,
      content: messageInput.trim(),
      replyToId: replyingTo?.id,
    });
    setMessageInput('');
    setReplyingTo(null);
    stopTyping();
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedConversationId || !user) return;
    
    setIsUploading(true);
    try {
      const uploadRes = await uploadService.uploadFile(file);
      const fileUrl = uploadRes.url;
      
      // Determine attachment type
      let attachmentType: 'image' | 'file' = 'file';
      if (file.type.startsWith('image/')) {
        attachmentType = 'image';
      }
      
      const messageContent = messageInput.trim() || (attachmentType === 'image' ? '📷 Image' : `📎 ${file.name}`);
      
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        content: messageContent,
        attachmentUrl: fileUrl,
        attachmentType,
        replyToId: replyingTo?.id,
      });
      
      setMessageInput('');
      setSelectedFile(null);
      setReplyingTo(null);
      toast.success('File sent!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to send file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDrop = (file: File) => {
    setSelectedFile(file);
  };
  
  const handleStartChat = async (userId: string) => {
    const conversationId = await createConversation.mutateAsync({
      participantId: userId,
      type: 'direct',
    });
    setSelectedConversationId(conversationId);
    setIsNewChatOpen(false);
  };

  const handleCreateGroupChat = async (name: string, participantIds: string[]) => {
    const conversationId = await createConversation.mutateAsync({
      participantIds,
      type: 'group',
      name,
    });
    setSelectedConversationId(conversationId);
    setIsNewChatOpen(false);
    toast.success('Group chat created!');
  };

  const handleAddParticipant = async (userId: string) => {
    if (!selectedConversationId) return;
    await addParticipant.mutateAsync({ conversationId: selectedConversationId, userId });
    toast.success('Participant added!');
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!selectedConversationId) return;
    await removeParticipant.mutateAsync({ conversationId: selectedConversationId, userId });
    toast.success('Participant removed!');
  };

  const handleRenameGroup = async (name: string) => {
    if (!selectedConversationId) return;
    await renameConversation.mutateAsync({ conversationId: selectedConversationId, name });
    toast.success('Group renamed!');
  };

  const handleMediaRecordingComplete = async (blob: Blob, type: 'audio' | 'video') => {
    if (!selectedConversationId || !user) return;
    
    setIsUploading(true);
    try {
      const fileExt = type === 'video' ? 'webm' : 'webm';
      const file = new File([blob], `recording-${Date.now()}.${fileExt}`, {
        type: type === 'video' ? 'video/webm' : 'audio/webm'
      });
      
      const uploadRes = await uploadService.uploadFile(file);
      const fileUrl = uploadRes.url;
      
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        content: type === 'video' ? '🎥 Video message' : '🎤 Voice message',
        attachmentUrl: fileUrl,
        attachmentType: type,
      });
      
      setRecordingType(null);
      toast.success(`${type === 'video' ? 'Video' : 'Voice'} message sent!`);
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to send media message');
    } finally {
      setIsUploading(false);
    }
  };
  
  const getConversationName = (conv: typeof conversations[0]) => {
    if (conv.name) return conv.name;
    if (conv.type === 'direct') {
      const otherParticipant = conv.participants?.find(p => p.user_id !== user?.id);
      return otherParticipant?.profile?.full_name || otherParticipant?.profile?.email || 'Unknown';
    }
    return 'Group Chat';
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  const filteredUsers = chatableUsers?.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout role={role}>
      <PageHeader
        title="Messages"
        description="Chat with teachers and students"
        breadcrumbs={[
          { label: t('nav.dashboard'), href: `/${userRole}` },
          { label: 'Messages' },
        ]}
      />

      <div className="flex h-[calc(100vh-200px)] gap-4 p-6">
        {/* Conversations List */}
        <Card className="w-80 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start New Chat</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="direct" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="direct" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Direct Chat
                      </TabsTrigger>
                      {(userRole === 'teacher' || userRole === 'admin') && (
                        <TabsTrigger value="group" className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Group Chat
                        </TabsTrigger>
                      )}
                    </TabsList>
                    
                    <TabsContent value="direct" className="space-y-4 mt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <ScrollArea className="h-64">
                        {loadingUsers ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                              <Skeleton key={i} className="h-12 w-full" />
                            ))}
                          </div>
                        ) : filteredUsers?.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4">No users found</p>
                        ) : (
                          <div className="space-y-1">
                            {filteredUsers?.map(chatUser => (
                              <button
                                key={chatUser.id}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                                onClick={() => handleStartChat(chatUser.id)}
                                disabled={createConversation.isPending}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={chatUser.avatar_url || ''} />
                                  <AvatarFallback>{getInitials(chatUser.full_name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left">
                                  <p className="font-medium">{chatUser.full_name || chatUser.email}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{chatUser.role}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                    
                    {(userRole === 'teacher' || userRole === 'admin') && (
                      <TabsContent value="group" className="mt-4">
                        <CreateGroupChat
                          users={chatableUsers}
                          isLoading={loadingUsers}
                          onCreateGroup={handleCreateGroupChat}
                          isCreating={createConversation.isPending}
                        />
                      </TabsContent>
                    )}
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-2 overflow-hidden">
            <ScrollArea className="h-full">
              {loadingConversations ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : conversations?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs">Start a new chat!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations?.map(conv => (
                    <button
                      key={conv.id}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                        selectedConversationId === conv.id
                          ? "bg-primary/10"
                          : "hover:bg-accent"
                      )}
                      onClick={() => setSelectedConversationId(conv.id)}
                    >
                      <Avatar className="h-10 w-10">
                        {conv.type === 'group' ? (
                          <AvatarFallback><Users className="h-4 w-4" /></AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src="" />
                            <AvatarFallback>{getInitials(getConversationName(conv))}</AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{getConversationName(conv)}</p>
                          {(conv.unread_count || 0) > 0 && (
                            <Badge variant="default" className="ml-2 h-5 min-w-5 justify-center">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.last_message.content}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <DragDropZone onFileDrop={handleFileDrop} disabled={!selectedConversation || isUploading}>
          <Card className="flex-1 flex flex-col h-full">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {selectedConversation.type === 'group' ? (
                        <AvatarFallback><Users className="h-4 w-4" /></AvatarFallback>
                      ) : (
                        <AvatarFallback>{getInitials(getConversationName(selectedConversation))}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{getConversationName(selectedConversation)}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.type === 'group' 
                          ? `${selectedConversation.participants?.length || 0} participants`
                          : 'Direct message'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => setIsSearchOpen(true)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    {selectedConversation.type === 'group' && (userRole === 'teacher' || userRole === 'admin') && (
                      <Dialog open={isManageParticipantsOpen} onOpenChange={setIsManageParticipantsOpen}>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage Group</DialogTitle>
                          </DialogHeader>
                          <ManageGroupParticipants
                            conversationId={selectedConversation.id}
                            conversationName={selectedConversation.name}
                            participants={selectedConversation.participants || []}
                            availableUsers={chatableUsers}
                            isLoading={loadingUsers}
                            currentUserId={user?.id || ''}
                            onAddParticipant={handleAddParticipant}
                            onRemoveParticipant={handleRemoveParticipant}
                            onRename={handleRenameGroup}
                            isUpdating={addParticipant.isPending || removeParticipant.isPending}
                            isRenaming={renameConversation.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {/* Message Search */}
              <MessageSearch
                conversationId={selectedConversationId}
                isOpen={isSearchOpen}
                onClose={() => {
                  setIsSearchOpen(false);
                  setHighlightedMessageId(null);
                }}
                onNavigateToMessage={(messageId) => {
                  setHighlightedMessageId(messageId);
                  // Scroll to message
                  setTimeout(() => {
                    messageRefs.current[messageId]?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center' 
                    });
                  }, 100);
                  // Remove highlight after a moment
                  setTimeout(() => {
                    setHighlightedMessageId(null);
                  }, 2000);
                }}
              />
              
              <CardContent className="flex-1 p-4 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-3/4" />
                      ))}
                    </div>
                  ) : messages?.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm">Send the first message!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages?.map((message) => {
                        const isOwn = message.sender_id === user?.id;
                        
                        // Group reactions by emoji and count them
                        const reactionGroups = (message.reactions || []).reduce((acc, reaction) => {
                          const existing = acc.find(r => r.emoji === reaction.emoji);
                          if (existing) {
                            existing.count++;
                            existing.users.push(reaction.user?.full_name || 'Unknown');
                            if (reaction.user_id === user?.id) existing.hasReacted = true;
                          } else {
                            acc.push({
                              emoji: reaction.emoji,
                              count: 1,
                              hasReacted: reaction.user_id === user?.id,
                              users: [reaction.user?.full_name || 'Unknown'],
                            });
                          }
                          return acc;
                        }, [] as { emoji: string; count: number; hasReacted: boolean; users: string[] }[]);
                        
                        const isEditing = editingMessageId === message.id;
                        
                        return (
                          <div
                            key={message.id}
                            ref={(el) => { messageRefs.current[message.id] = el; }}
                            className={cn(
                              "flex gap-2 group transition-all duration-300",
                              isOwn ? "justify-end" : "justify-start",
                              highlightedMessageId === message.id && "bg-yellow-100 dark:bg-yellow-900/30 -mx-2 px-2 py-1 rounded-lg"
                            )}
                          >
                            {!isOwn && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={message.sender?.avatar_url || ''} />
                                <AvatarFallback>{getInitials(message.sender?.full_name)}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex flex-col relative">
                              <div className={cn(
                                "max-w-[70%] rounded-lg px-3 py-2 relative",
                                isOwn 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              )}>
                                {!isOwn && (
                                  <p className="text-xs font-medium mb-1">
                                    {message.sender?.full_name || message.sender?.email}
                                  </p>
                                )}
                                {message.reply_to && (
                                  <ReplyPreview
                                    replyTo={{
                                      id: message.reply_to.id,
                                      content: message.reply_to.content,
                                      senderName: message.reply_to.sender?.full_name || null,
                                    }}
                                    onCancel={() => {}}
                                    variant="message"
                                    isOwn={isOwn}
                                  />
                                )}
                                {message.attachment_url && message.attachment_type && (
                                  <div className="mb-2">
                                    <ChatMediaMessage
                                      url={message.attachment_url}
                                      type={message.attachment_type as 'audio' | 'video' | 'image' | 'file'}
                                      isOwn={isOwn}
                                    />
                                  </div>
                                )}
                                {isEditing ? (
                                  <EditMessageInput
                                    initialContent={message.content}
                                    onSave={(content) => {
                                      editMessage.mutate({
                                        messageId: message.id,
                                        content,
                                        conversationId: selectedConversationId!,
                                      });
                                      setEditingMessageId(null);
                                    }}
                                    onCancel={() => setEditingMessageId(null)}
                                    isLoading={editMessage.isPending}
                                  />
                                ) : (
                                  <>
                                    {message.content && !message.content.startsWith('🎥') && !message.content.startsWith('🎤') && !message.content.startsWith('📷') && !message.content.startsWith('📎') && (
                                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    )}
                                    {message.updated_at !== message.created_at && (
                                      <span className={cn(
                                        "text-[9px] italic",
                                        isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                                      )}>
                                        (edited)
                                      </span>
                                    )}
                                  </>
                                )}
                                <div className={cn(
                                  "flex items-center gap-0.5 text-[10px] mt-1",
                                  isOwn ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
                                )}>
                                  <span>{format(new Date(message.created_at), 'HH:mm')}</span>
                                  {isOwn && readReceipts && (
                                    <ReadReceipt
                                      messageCreatedAt={message.created_at}
                                      readers={readReceipts}
                                      isOwn={isOwn}
                                    />
                                  )}
                                </div>
                                {!isEditing && (
                                  <MessageActions
                                    messageId={message.id}
                                    content={message.content}
                                    isOwn={isOwn}
                                    onEdit={(id, content) => {
                                      editMessage.mutate({
                                        messageId: id,
                                        content,
                                        conversationId: selectedConversationId!,
                                      });
                                    }}
                                    onDelete={(id) => {
                                      deleteMessage.mutate({
                                        messageId: id,
                                        conversationId: selectedConversationId!,
                                      });
                                    }}
                                    onReply={(id) => {
                                      setReplyingTo({
                                        id: message.id,
                                        content: message.content,
                                        senderName: message.sender?.full_name || null,
                                      });
                                    }}
                                    isEditing={isEditing}
                                    onStartEdit={() => setEditingMessageId(message.id)}
                                    onCancelEdit={() => setEditingMessageId(null)}
                                  />
                                )}
                              </div>
                              <MessageReactions
                                reactions={reactionGroups}
                                onAddReaction={(emoji) => addReaction.mutate({ messageId: message.id, emoji })}
                                onRemoveReaction={(emoji) => removeReaction.mutate({ messageId: message.id, emoji })}
                                isOwn={isOwn}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                  {selectedConversationId && user && (
                    <TypingIndicator
                      conversationId={selectedConversationId}
                      currentUserId={user.id}
                    />
                  )}
                </ScrollArea>
              </CardContent>
              
              <div className="p-4 border-t space-y-3">
                {recordingType && (
                  <MediaRecorderComponent
                    type={recordingType}
                    onRecordingComplete={handleMediaRecordingComplete}
                    onCancel={() => setRecordingType(null)}
                    isUploading={isUploading}
                  />
                )}
                
                {selectedFile && (
                  <FilePreview
                    file={selectedFile}
                    onRemove={() => setSelectedFile(null)}
                  />
                )}
                
                {replyingTo && (
                  <ReplyPreview
                    replyTo={replyingTo}
                    onCancel={() => setReplyingTo(null)}
                    variant="input"
                  />
                )}
                
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <div className="flex gap-1">
                    <FileUploadArea
                      onFileSelect={handleFileDrop}
                      isUploading={isUploading}
                      disabled={sendMessage.isPending}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setRecordingType(recordingType === 'audio' ? null : 'audio')}
                      className={cn(recordingType === 'audio' && 'bg-primary/10 text-primary')}
                      disabled={isUploading}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setRecordingType(recordingType === 'video' ? null : 'video')}
                      className={cn(recordingType === 'video' && 'bg-primary/10 text-primary')}
                      disabled={isUploading}
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    disabled={sendMessage.isPending || isUploading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={(!messageInput.trim() && !selectedFile) || sendMessage.isPending || isUploading}>
                    {sendMessage.isPending || isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-sm">Choose from your existing conversations or start a new one</p>
              </div>
            </div>
          )}
          </Card>
        </DragDropZone>
      </div>
    </DashboardLayout>
  );
}
