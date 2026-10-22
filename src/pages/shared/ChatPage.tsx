import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  Message,
} from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { uploadService } from '@/services/apiService';
import { 
  MessageSquare, Send, Plus, Users, Loader2, Search, Mic, Video, User, 
  Settings, ShieldCheck, GraduationCap, CheckCheck, Check, Smile, Paperclip,
  Sparkles, ArrowLeft, Info, PhoneCall, Image as ImageIcon
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
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
import { EmojiPickerPopover } from '@/components/chat/EmojiPickerPopover';

export default function ChatPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const userRole = role || 'student';
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeContactFilter, setActiveContactFilter] = useState<'all' | 'admin' | 'teacher'>('all');
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
  const inputRef = useRef<HTMLInputElement>(null);
  
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
  
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!messageInput.trim() && !selectedFile) || !selectedConversationId) return;
    
    // If there's a file, upload it first
    if (selectedFile) {
      await handleFileUpload(selectedFile);
      return;
    }
    
    const content = messageInput.trim();
    setMessageInput('');
    setReplyingTo(null);
    stopTyping();

    await sendMessage.mutateAsync({
      conversationId: selectedConversationId,
      content,
      replyToId: replyingTo?.id,
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedConversationId || !user) return;
    
    setIsUploading(true);
    try {
      const uploadRes = await uploadService.uploadFile(file);
      const fileUrl = uploadRes.url;
      
      let attachmentType: 'image' | 'video' | 'audio' | 'file' = 'file';
      if (file.type.startsWith('image/')) {
        attachmentType = 'image';
      } else if (file.type.startsWith('video/')) {
        attachmentType = 'video';
      } else if (file.type.startsWith('audio/')) {
        attachmentType = 'audio';
      }
      
      const messageContent = messageInput.trim() || (
        attachmentType === 'image' ? '📷 صورة' :
        attachmentType === 'video' ? '🎥 فيديو' :
        attachmentType === 'audio' ? '🎤 تسجيل صوتي' :
        `📎 ${file.name}`
      );
      
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
      toast.success('تم إرسال الملف بنجاح!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('فشل رفع وإرسال الملف');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDrop = (file: File) => {
    setSelectedFile(file);
  };
  
  const handleStartChat = async (userId: string) => {
    try {
      const conversationId = await createConversation.mutateAsync({
        participantId: userId,
        type: 'direct',
      });
      if (conversationId) {
        setSelectedConversationId(conversationId);
      }
      setIsNewChatOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'فشل بدء المحادثة');
    }
  };

  const handleCreateGroupChat = async (name: string, participantIds: string[]) => {
    const conversationId = await createConversation.mutateAsync({
      participantIds,
      type: 'group',
      name,
    });
    setSelectedConversationId(conversationId);
    setIsNewChatOpen(false);
    toast.success('تم إنشاء المجموعة بنجاح!');
  };

  const handleAddParticipant = async (userId: string) => {
    if (!selectedConversationId) return;
    await addParticipant.mutateAsync({ conversationId: selectedConversationId, userId });
    toast.success('تمت إضافة العضو للمجموعة');
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!selectedConversationId) return;
    await removeParticipant.mutateAsync({ conversationId: selectedConversationId, userId });
    toast.success('تمت إزالة العضو من المجموعة');
  };

  const handleRenameGroup = async (name: string) => {
    if (!selectedConversationId) return;
    await renameConversation.mutateAsync({ conversationId: selectedConversationId, name });
    toast.success('تم تغيير اسم المجموعة');
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
        content: type === 'video' ? '🎥 رسالة فيديو' : '🎤 تسجيل صوتي',
        attachmentUrl: fileUrl,
        attachmentType: type,
      });
      
      setRecordingType(null);
      toast.success(type === 'video' ? 'تم إرسال رسالة الفيديو!' : 'تم إرسال التسجيل الصوتي!');
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('فشل إرسال التسجيل');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    inputRef.current?.focus();
  };
  
  const getConversationPartner = (conv: typeof conversations[0]) => {
    if (conv.type === 'direct') {
      const otherParticipant = conv.participants?.find(p => p.user_id !== user?.id);
      return otherParticipant;
    }
    return null;
  };

  const getConversationName = (conv: typeof conversations[0]) => {
    if (conv.name) return conv.name;
    if (conv.type === 'direct') {
      const otherParticipant = getConversationPartner(conv);
      return otherParticipant?.profile?.full_name || otherParticipant?.profile?.email || 'مستخدم';
    }
    return 'مجموعة دردشة';
  };

  const getConversationRole = (conv: typeof conversations[0]) => {
    if (conv.type === 'direct') {
      const other = getConversationPartner(conv);
      // Find in chatableUsers if possible
      const matched = chatableUsers?.find(u => u.id === other?.user_id);
      return matched?.role || 'user';
    }
    return 'group';
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filter conversations by search
  const filteredConversations = conversations?.filter(c => {
    const name = getConversationName(c).toLowerCase();
    const lastMsg = c.last_message?.content?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return name.includes(q) || lastMsg.includes(q);
  });

  // Filter available contacts for starting chat
  const filteredContacts = chatableUsers?.filter(u => {
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeContactFilter === 'admin') return matchesSearch && u.role === 'admin';
    if (activeContactFilter === 'teacher') return matchesSearch && u.role === 'teacher';
    return matchesSearch;
  });

  const adminContacts = chatableUsers?.filter(u => u.role === 'admin') || [];
  const teacherContacts = chatableUsers?.filter(u => u.role === 'teacher') || [];

  const formatMessageDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return 'اليوم';
    if (isYesterday(d)) return 'أمس';
    return format(d, 'dd MMMM yyyy');
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activePartner = selectedConversation ? getConversationPartner(selectedConversation) : null;
  const activePartnerRole = selectedConversation ? getConversationRole(selectedConversation) : null;

  return (
    <DashboardLayout role={role}>
      <div className="h-[calc(100vh-100px)] max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
        {/* Main Instagram Style Chat Container */}
        <div className="h-full rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col md:flex-row">
          
          {/* ========================================================= */}
          {/* LEFT SIDEBAR: INSTAGRAM DIRECT CONVERSATIONS LIST */}
          {/* ========================================================= */}
          <div className={cn(
            "w-full md:w-[360px] lg:w-[400px] border-b md:border-b-0 md:border-r border-border/60 flex flex-col bg-background/50",
            selectedConversationId ? "hidden md:flex" : "flex"
          )}>
            {/* Direct Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="p-[2px] rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400">
                    <Avatar className="h-10 w-10 border-2 border-background">
                      <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
                      <AvatarFallback className="font-bold text-xs bg-purple-100 text-purple-700">
                        {getInitials(user?.user_metadata?.full_name || user?.email)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
                    {user?.user_metadata?.full_name || 'حسابي'}
                  </h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    المحادثات والرسائل
                  </p>
                </div>
              </div>

              {/* Start New Chat Button */}
              <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-transform hover:scale-105"
                    title="محادثة جديدة"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      بدء محادثة جديدة / New Chat
                    </DialogTitle>
                  </DialogHeader>

                  <Tabs defaultValue="contacts" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="contacts" className="flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        مراسلة مباشرة
                      </TabsTrigger>
                      {(userRole === 'teacher' || userRole === 'admin') ? (
                        <TabsTrigger value="group" className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          مجموعة
                        </TabsTrigger>
                      ) : (
                        <TabsTrigger value="support" className="flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-purple-500" />
                          الإدارة والدعم
                        </TabsTrigger>
                      )}
                    </TabsList>

                    {/* Direct Contacts Tab */}
                    <TabsContent value="contacts" className="space-y-3 mt-4">
                      {/* Search Contacts */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ابحث عن أستاذ أو إدارة..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 rounded-xl"
                        />
                      </div>

                      {/* Filter Pills */}
                      <div className="flex items-center gap-1.5 pb-1">
                        <button
                          type="button"
                          onClick={() => setActiveContactFilter('all')}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                            activeContactFilter === 'all'
                              ? "bg-purple-600 text-white"
                              : "bg-accent text-muted-foreground hover:text-foreground"
                          )}
                        >
                          الكل ({chatableUsers?.length || 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveContactFilter('admin')}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1",
                            activeContactFilter === 'admin'
                              ? "bg-blue-600 text-white"
                              : "bg-accent text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          الإدارة ({adminContacts.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveContactFilter('teacher')}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1",
                            activeContactFilter === 'teacher'
                              ? "bg-amber-600 text-white"
                              : "bg-accent text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <GraduationCap className="w-3 h-3" />
                          الأساتذة ({teacherContacts.length})
                        </button>
                      </div>

                      {/* Contacts List */}
                      <ScrollArea className="h-72">
                        {loadingUsers ? (
                          <div className="space-y-2 p-1">
                            {[1, 2, 3, 4].map(i => (
                              <Skeleton key={i} className="h-14 w-full rounded-xl" />
                            ))}
                          </div>
                        ) : filteredContacts?.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">لا توجد جهات اتصال مطابقة</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 p-1">
                            {filteredContacts?.map(contact => (
                              <button
                                key={contact.id}
                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/80 transition-all text-left border border-transparent hover:border-border/50 group"
                                onClick={() => handleStartChat(contact.id)}
                                disabled={createConversation.isPending}
                              >
                                <Avatar className="h-11 w-11 border">
                                  <AvatarImage src={contact.avatar_url || ''} />
                                  <AvatarFallback className="font-semibold text-xs bg-purple-100 text-purple-700">
                                    {getInitials(contact.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                                      {contact.full_name}
                                    </p>
                                    {contact.role === 'admin' ? (
                                      <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-400/30 text-[10px] gap-1">
                                        <ShieldCheck className="w-2.5 h-2.5" />
                                        إدارة
                                      </Badge>
                                    ) : contact.role === 'teacher' ? (
                                      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-400/30 text-[10px] gap-1">
                                        <GraduationCap className="w-2.5 h-2.5" />
                                        أستاذ
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    {/* Support Quick Tab for Students */}
                    {userRole === 'student' && (
                      <TabsContent value="support" className="space-y-3 mt-4">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 text-center">
                          <ShieldCheck className="w-10 h-10 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                          <h4 className="font-bold text-sm text-foreground">فريق إدارة ودعم منصة Nexyvora</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            يمكنك مراسلة الإدارة للاستفسارات التقنية، الدفعات، الترقية، أو أي دعم تحتاجه.
                          </p>
                          <div className="mt-4 space-y-2">
                            {adminContacts.map(adm => (
                              <Button
                                key={adm.id}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-md gap-2"
                                onClick={() => handleStartChat(adm.id)}
                              >
                                <MessageSquare className="w-4 h-4" />
                                فتح محادثة مع {adm.full_name || 'الإدارة'}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    )}

                    {/* Group Tab for Admins/Teachers */}
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

            {/* Quick Action Chips for Fast Contact */}
            <div className="px-3 pt-3 pb-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {adminContacts.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleStartChat(adminContacts[0].id)}
                  className="px-2.5 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold shrink-0 flex items-center gap-1 border border-blue-500/20 transition-all active:scale-95"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  مراسلة الإدارة
                </button>
              )}
              {teacherContacts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsNewChatOpen(true);
                    setActiveContactFilter('teacher');
                  }}
                  className="px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold shrink-0 flex items-center gap-1 border border-amber-500/20 transition-all active:scale-95"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  مراسلة الأساتذة
                </button>
              )}
            </div>

            {/* Search Conversations Input */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في الرسائل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 rounded-xl bg-accent/40 border-none focus-visible:ring-1 focus-visible:ring-primary text-xs"
                />
              </div>
            </div>

            {/* Conversations Scroll Area */}
            <ScrollArea className="flex-1 px-2 pb-2">
              {loadingConversations ? (
                <div className="space-y-2 p-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              ) : filteredConversations?.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">لا توجد محادثات حتى الآن</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      ابدأ أول محادثة الآن وتواصل مع أستاذك أو إدارة المنصة.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    {adminContacts.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10 text-xs gap-1.5"
                        onClick={() => handleStartChat(adminContacts[0].id)}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                        مراسلة الإدارة والدعم الفني
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs gap-1.5"
                      onClick={() => setIsNewChatOpen(true)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      محادثة جديدة
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations?.map(conv => {
                    const isSelected = selectedConversationId === conv.id;
                    const convName = getConversationName(conv);
                    const convRole = getConversationRole(conv);
                    const isUnread = (conv.unread_count || 0) > 0;

                    return (
                      <button
                        key={conv.id}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left relative group",
                          isSelected
                            ? "bg-purple-500/15 border border-purple-500/30 shadow-sm"
                            : "hover:bg-accent/60 border border-transparent"
                        )}
                        onClick={() => setSelectedConversationId(conv.id)}
                      >
                        {/* Avatar with Story-style Gradient Border */}
                        <div className="relative shrink-0">
                          <div className={cn(
                            "p-[2px] rounded-full transition-transform group-hover:scale-105",
                            isSelected
                              ? "bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-400"
                              : "bg-border"
                          )}>
                            <Avatar className="h-11 w-11 border-2 border-background">
                              {conv.type === 'group' ? (
                                <AvatarFallback className="bg-purple-100 text-purple-700">
                                  <Users className="h-5 w-5" />
                                </AvatarFallback>
                              ) : (
                                <AvatarFallback className="bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-800 font-bold text-xs">
                                  {getInitials(convName)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <p className={cn(
                                "font-semibold text-sm truncate",
                                isSelected ? "text-purple-600 dark:text-purple-300" : "text-foreground"
                              )}>
                                {convName}
                              </p>
                              {convRole === 'admin' ? (
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" title="إدارة" />
                              ) : convRole === 'teacher' ? (
                                <GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" title="أستاذ" />
                              ) : null}
                            </div>
                            {conv.last_message && (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {format(new Date(conv.last_message.created_at), 'HH:mm')}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "text-xs truncate",
                              isUnread ? "font-bold text-foreground" : "text-muted-foreground"
                            )}>
                              {conv.last_message?.attachment_type === 'image' ? '📷 صورة' :
                               conv.last_message?.attachment_type === 'video' ? '🎥 فيديو' :
                               conv.last_message?.attachment_type === 'audio' ? '🎤 تسجيل صوتي' :
                               conv.last_message?.content || 'ابدأ المحادثة...'}
                            </p>

                            {isUnread && (
                              <Badge className="h-5 min-w-5 px-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PANEL: ACTIVE CHAT THREAD (INSTAGRAM DIRECT STYLE) */}
          {/* ========================================================= */}
          <div className={cn(
            "flex-1 flex flex-col h-full bg-background relative overflow-hidden",
            !selectedConversationId ? "hidden md:flex" : "flex"
          )}>
            {selectedConversation ? (
              <DragDropZone onFileDrop={handleFileDrop} disabled={isUploading}>
                <div className="flex flex-col h-full">
                  {/* Top Bar (Instagram Style) */}
                  <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-card/60 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                      {/* Mobile Back Button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="md:hidden h-8 w-8 rounded-full"
                        onClick={() => setSelectedConversationId(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>

                      <div className="relative">
                        <Avatar className="h-10 w-10 border shadow-sm">
                          {selectedConversation.type === 'group' ? (
                            <AvatarFallback className="bg-purple-100 text-purple-700">
                              <Users className="h-5 w-5" />
                            </AvatarFallback>
                          ) : (
                            <AvatarFallback className="bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs">
                              {getInitials(getConversationName(selectedConversation))}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-foreground leading-tight">
                            {getConversationName(selectedConversation)}
                          </h3>
                          {activePartnerRole === 'admin' ? (
                            <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-400/30 text-[10px] gap-1 py-0">
                              <ShieldCheck className="w-3 h-3" />
                              إدارة المنصة والدعم
                            </Badge>
                          ) : activePartnerRole === 'teacher' ? (
                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-400/30 text-[10px] gap-1 py-0">
                              <GraduationCap className="w-3 h-3" />
                              أستاذ معتمد
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          متصل الآن / Active now
                        </p>
                      </div>
                    </div>

                    {/* Top Actions */}
                    <div className="flex items-center gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                        onClick={() => setIsSearchOpen(true)}
                        title="بحث في المحادثة"
                      >
                        <Search className="h-4 w-4" />
                      </Button>

                      {selectedConversation.type === 'group' && (userRole === 'teacher' || userRole === 'admin') && (
                        <Dialog open={isManageParticipantsOpen} onOpenChange={setIsManageParticipantsOpen}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>إدارة المجموعة</DialogTitle>
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

                  {/* Search Overlay */}
                  <MessageSearch
                    conversationId={selectedConversationId}
                    isOpen={isSearchOpen}
                    onClose={() => {
                      setIsSearchOpen(false);
                      setHighlightedMessageId(null);
                    }}
                    onNavigateToMessage={(messageId) => {
                      setHighlightedMessageId(messageId);
                      setTimeout(() => {
                        messageRefs.current[messageId]?.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'center' 
                        });
                      }, 100);
                      setTimeout(() => {
                        setHighlightedMessageId(null);
                      }, 2000);
                    }}
                  />

                  {/* Messages Stream */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {loadingMessages ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={cn("flex gap-2", i % 2 === 0 ? "justify-end" : "justify-start")}>
                            <Skeleton className="h-14 w-60 rounded-2xl" />
                          </div>
                        ))}
                      </div>
                    ) : messages?.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground py-16">
                        <div className="text-center space-y-3 max-w-sm">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-amber-500/20 flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400">
                            <Sparkles className="w-8 h-8" />
                          </div>
                          <h4 className="font-bold text-base text-foreground">
                            {getConversationName(selectedConversation)}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            محادثة مشفرة وآمنة. أرسل رسالة نصية، صورة، تسجيل صوتي، أو مقطع فيديو للبدء!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages?.map((message, index) => {
                          const isOwn = message.sender_id === user?.id;
                          const prevMessage = index > 0 ? messages[index - 1] : null;
                          const showDateHeader = !prevMessage || 
                            new Date(message.created_at).toDateString() !== new Date(prevMessage.created_at).toDateString();

                          const reactionGroups = (message.reactions || []).reduce((acc, reaction) => {
                            const existing = acc.find(r => r.emoji === reaction.emoji);
                            if (existing) {
                              existing.count++;
                              existing.users.push(reaction.user?.full_name || 'مستخدم');
                              if (reaction.user_id === user?.id) existing.hasReacted = true;
                            } else {
                              acc.push({
                                emoji: reaction.emoji,
                                count: 1,
                                hasReacted: reaction.user_id === user?.id,
                                users: [reaction.user?.full_name || 'مستخدم'],
                              });
                            }
                            return acc;
                          }, [] as { emoji: string; count: number; hasReacted: boolean; users: string[] }[]);
                          
                          const isEditing = editingMessageId === message.id;

                          return (
                            <div key={message.id} className="space-y-3">
                              {/* Date Separator Pill */}
                              {showDateHeader && (
                                <div className="flex justify-center my-4">
                                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-accent/60 text-muted-foreground border border-border/40 select-none">
                                    {formatMessageDateHeader(message.created_at)}
                                  </span>
                                </div>
                              )}

                              {/* Message Row */}
                              <div
                                ref={(el) => { messageRefs.current[message.id] = el; }}
                                className={cn(
                                  "flex gap-2 group transition-all duration-300 items-end",
                                  isOwn ? "justify-end" : "justify-start",
                                  highlightedMessageId === message.id && "bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-2xl"
                                )}
                              >
                                {!isOwn && (
                                  <Avatar className="h-7 w-7 mb-1 shrink-0">
                                    <AvatarImage src={message.sender?.avatar_url || ''} />
                                    <AvatarFallback className="text-[10px] bg-purple-100 text-purple-700 font-bold">
                                      {getInitials(message.sender?.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}

                                <div className="flex flex-col relative max-w-[85%] sm:max-w-[70%]">
                                  {/* Sender name on group or other's message */}
                                  {!isOwn && selectedConversation.type === 'group' && (
                                    <span className="text-[10px] text-muted-foreground mb-1 ml-2 font-medium">
                                      {message.sender?.full_name || message.sender?.email}
                                    </span>
                                  )}

                                  {/* Instagram Style Bubble */}
                                  <div className={cn(
                                    "rounded-2xl px-4 py-2.5 relative shadow-sm transition-all",
                                    isOwn 
                                      ? "bg-gradient-to-tr from-purple-600 via-purple-600 to-indigo-600 text-white rounded-br-sm" 
                                      : "bg-muted/90 dark:bg-slate-800 text-foreground border border-border/50 rounded-bl-sm"
                                  )}>
                                    {/* Reply Preview */}
                                    {message.reply_to && (
                                      <div className="mb-2">
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
                                      </div>
                                    )}

                                    {/* Media Attachment (Photo, Video, Audio, Document) */}
                                    {message.attachment_url && message.attachment_type && (
                                      <div className="mb-2">
                                        <ChatMediaMessage
                                          url={message.attachment_url}
                                          type={message.attachment_type as 'audio' | 'video' | 'image' | 'file'}
                                          isOwn={isOwn}
                                        />
                                      </div>
                                    )}

                                    {/* Text Content */}
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
                                        {message.content && !message.content.startsWith('🎥') && !message.content.startsWith('🎤') && !message.content.startsWith('📷') && (
                                          <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                                            {message.content}
                                          </p>
                                        )}
                                        {message.updated_at !== message.created_at && (
                                          <span className={cn(
                                            "text-[9px] italic block mt-0.5",
                                            isOwn ? "text-white/60" : "text-muted-foreground"
                                          )}>
                                            (معدل)
                                          </span>
                                        )}
                                      </>
                                    )}

                                    {/* Timestamp & Status Icon */}
                                    <div className={cn(
                                      "flex items-center gap-1 text-[10px] mt-1 select-none",
                                      isOwn ? "text-white/70 justify-end" : "text-muted-foreground"
                                    )}>
                                      <span>{format(new Date(message.created_at), 'HH:mm')}</span>
                                      {isOwn && (
                                        <CheckCheck className="w-3.5 h-3.5 text-white/80 inline" />
                                      )}
                                    </div>

                                    {/* Message Quick Actions Hover Bar */}
                                    {!isEditing && (
                                      <div className={cn(
                                        "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 -translate-y-1/2",
                                        isOwn ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"
                                      )}>
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
                                      </div>
                                    )}
                                  </div>

                                  {/* Emoji Reactions display */}
                                  <div className="mt-1">
                                    <MessageReactions
                                      reactions={reactionGroups}
                                      onAddReaction={(emoji) => addReaction.mutate({ messageId: message.id, emoji })}
                                      onRemoveReaction={(emoji) => removeReaction.mutate({ messageId: message.id, emoji })}
                                      isOwn={isOwn}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}

                    {/* Typing Indicator */}
                    {selectedConversationId && user && (
                      <TypingIndicator
                        conversationId={selectedConversationId}
                        currentUserId={user.id}
                      />
                    )}
                  </div>

                  {/* ========================================================= */}
                  {/* INSTAGRAM DIRECT INPUT PILL BAR */}
                  {/* ========================================================= */}
                  <div className="p-3 sm:p-4 border-t border-border/60 bg-card/70 backdrop-blur-md space-y-2">
                    {/* Media Recorder UI (Audio or Video) */}
                    {recordingType && (
                      <div className="rounded-2xl border border-purple-500/30 overflow-hidden shadow-lg">
                        <MediaRecorderComponent
                          type={recordingType}
                          onRecordingComplete={handleMediaRecordingComplete}
                          onCancel={() => setRecordingType(null)}
                          isUploading={isUploading}
                        />
                      </div>
                    )}
                    
                    {/* File Attachment Preview */}
                    {selectedFile && (
                      <FilePreview
                        file={selectedFile}
                        onRemove={() => setSelectedFile(null)}
                      />
                    )}
                    
                    {/* Replying Banner */}
                    {replyingTo && (
                      <ReplyPreview
                        replyTo={replyingTo}
                        onCancel={() => setReplyingTo(null)}
                        variant="input"
                      />
                    )}

                    {/* Input Composer Pill */}
                    <form 
                      onSubmit={handleSendMessage} 
                      className="flex items-center gap-2 bg-accent/40 dark:bg-slate-900/90 border border-border/70 rounded-full px-2 sm:px-3 py-1.5 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500/50 transition-all shadow-inner"
                    >
                      {/* Emoji Picker Popover */}
                      <EmojiPickerPopover onEmojiSelect={handleEmojiSelect} disabled={isUploading} />

                      {/* File / Media Attachment Picker */}
                      <FileUploadArea
                        onFileSelect={handleFileDrop}
                        isUploading={isUploading}
                        disabled={sendMessage.isPending}
                      />

                      {/* Voice Note Audio Recording Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setRecordingType(recordingType === 'audio' ? null : 'audio')}
                        className={cn(
                          "h-9 w-9 rounded-full text-muted-foreground hover:text-foreground transition-colors",
                          recordingType === 'audio' && "bg-purple-500/20 text-purple-600"
                        )}
                        disabled={isUploading}
                        title="تسجيل رسالة صوتية (Audio note)"
                      >
                        <Mic className="h-5 w-5" />
                      </Button>

                      {/* Video Message Recording Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setRecordingType(recordingType === 'video' ? null : 'video')}
                        className={cn(
                          "h-9 w-9 rounded-full text-muted-foreground hover:text-foreground transition-colors",
                          recordingType === 'video' && "bg-purple-500/20 text-purple-600"
                        )}
                        disabled={isUploading}
                        title="تسجيل فيديو (Video message)"
                      >
                        <Video className="h-5 w-5" />
                      </Button>

                      {/* Main Text Input */}
                      <Input
                        ref={inputRef}
                        placeholder="اكتب رسالة... / Message..."
                        value={messageInput}
                        onChange={(e) => {
                          setMessageInput(e.target.value);
                          handleTyping();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={sendMessage.isPending || isUploading}
                        className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-sm placeholder:text-muted-foreground/70"
                      />

                      {/* Send Button */}
                      <Button 
                        type="submit" 
                        size="icon"
                        disabled={(!messageInput.trim() && !selectedFile) || sendMessage.isPending || isUploading}
                        className={cn(
                          "h-9 w-9 rounded-full shrink-0 transition-all shadow-md",
                          (messageInput.trim() || selectedFile)
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 scale-100"
                            : "opacity-40 cursor-not-allowed bg-muted text-muted-foreground"
                        )}
                      >
                        {sendMessage.isPending || isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              </DragDropZone>
            ) : (
              /* Instagram Style Empty State */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-background to-accent/20">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600/20 via-pink-600/20 to-amber-500/20 flex items-center justify-center mb-6 shadow-inner">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-2">رسائلك الخاصة / Your Messages</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                  أرسل واستقبل الرسائل النصية والصور ومقاطع الفيديو والتسجيلات الصوتية مع الأساتذة وإدارة المنصة في بيئة آمنة وتفاعلية.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {adminContacts.length > 0 && (
                    <Button 
                      className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2 px-5"
                      onClick={() => handleStartChat(adminContacts[0].id)}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      مراسلة إدارة المنصة
                    </Button>
                  )}
                  <Button 
                    className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md gap-2 px-5 hover:opacity-95"
                    onClick={() => setIsNewChatOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    بدء محادثة جديدة
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
