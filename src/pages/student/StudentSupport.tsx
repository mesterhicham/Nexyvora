import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  LifeBuoy, 
  Bot, 
  Send, 
  Sparkles, 
  Ticket, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  User,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  FileQuestion,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { supportService } from '@/services/apiService';
import { SupportTicket, SupportMessage, TicketCategory, TicketPriority, TicketStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  canEscalate?: boolean;
  suggestEscalate?: boolean;
  timestamp: string;
}

export default function StudentSupport() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'ai' | 'tickets' | 'new'>('ai');

  // ─── AI Chat State ──────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Tickets List State ─────────────────────────────────────────────────────
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ─── Active Ticket Modal / Details ──────────────────────────────────────────
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // ─── New Ticket Form State ──────────────────────────────────────────────────
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('general');
  const [newPriority, setNewPriority] = useState<TicketPriority>('medium');
  const [newMessage, setNewMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Initial welcome message from AI
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: t(
            'support.ai.welcomeSubtitle',
            'مرحباً بك في مركز الدعم الفني لمنصة Nexyvora! أنا المساعد الذكي، جاهز للإجابة فوراً عن استفساراتك حول استخدام المنصة، الباقات، المحفظة، الإيداع والسحب، الأكاديمية والشهادات، والتوثيق.'
          ),
          canEscalate: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, []);

  // Fetch tickets when tickets tab is active
  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchUserTickets();
    }
  }, [activeTab, statusFilter]);

  // Scroll AI messages to bottom
  useEffect(() => {
    if (activeTab === 'ai') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, aiLoading, activeTab]);

  const fetchUserTickets = async () => {
    try {
      setLoadingTickets(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const res = await supportService.getTickets(params);
      setTickets(res.tickets || []);
    } catch (err: any) {
      toast.error(t('support.loadError', 'فشل في تحميل تذاكر الدعم'));
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleOpenTicketDetails = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    try {
      setLoadingThread(true);
      const res = await supportService.getTicketDetails(ticket.id);
      setSelectedTicket(res.ticket);
      setTicketMessages(res.messages || []);
    } catch (err: any) {
      toast.error(t('support.threadError', 'فشل في تحميل تفاصيل التذكرة'));
    } finally {
      setLoadingThread(false);
    }
  };

  // Send message in AI Chat
  const handleSendAiMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuestion).trim();
    if (!query || aiLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setAiLoading(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await supportService.aiChat({
        message: query,
        history
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        canEscalate: res.canEscalate !== false,
        suggestEscalate: !!res.suggestEscalate,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'عذراً، حدث خطأ أثناء معالجة السؤال. يمكنك المحاولة مجدداً أو الضغط أدناه لفتح تذكرة دعم فني والتواصل مباشرة مع فريق الإدارة.',
          canEscalate: true,
          suggestEscalate: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Escalate from AI to Human Ticket
  const handleEscalateToTicket = (inquiryContext?: string) => {
    const lastUserMessage = [...chatMessages].reverse().find(m => m.role === 'user')?.content || '';
    const textToFill = inquiryContext || lastUserMessage;
    
    setNewSubject(textToFill.slice(0, 80));
    setNewMessage(textToFill);
    setActiveTab('new');
    toast.info(t('support.ai.escalateNotice', 'تم نقلك لنموذج فتح التذكرة مع تفاصيل سؤالك'));
  };

  // Submit New Ticket
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || newSubject.trim().length < 3) {
      toast.error('يرجى كتابة عنوان للتذكرة لا يقل عن 3 أحرف');
      return;
    }
    if (!newMessage.trim() || newMessage.trim().length < 5) {
      toast.error('يرجى توضيح المشكلة بالتفصيل (5 أحرف على الأقل)');
      return;
    }

    try {
      setCreatingTicket(true);
      const res = await supportService.createTicket({
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        message: newMessage.trim()
      });

      toast.success(`${t('support.createTicket.success', 'تم إنشاء تذكرة الدعم بنجاح! رقم التذكرة: ')}${res.ticket?.ticket_number}`);
      
      // Reset form
      setNewSubject('');
      setNewMessage('');
      setNewCategory('general');
      setNewPriority('medium');

      // Switch to tickets tab and refresh
      setActiveTab('tickets');
      fetchUserTickets();

      if (res.ticket?.id) {
        handleOpenTicketDetails(res.ticket as SupportTicket);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('support.createTicket.error', 'حدث خطأ أثناء إنشاء التذكرة'));
    } finally {
      setCreatingTicket(false);
    }
  };

  // Send Reply in Ticket Thread
  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim() || sendingReply) return;

    try {
      setSendingReply(true);
      const res = await supportService.addMessage(selectedTicket.id, {
        message: replyText.trim()
      });

      setTicketMessages(prev => [...prev, res.newMessage]);
      setReplyText('');
      if (res.newStatus) {
        setSelectedTicket(prev => prev ? { ...prev, status: res.newStatus } : null);
      }
      toast.success(t('support.ticketDetails.replySuccess', 'تم إرسال ردك بنجاح.'));
      fetchUserTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'فشل إرسال الرد');
    } finally {
      setSendingReply(false);
    }
  };

  // Close Ticket
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      await supportService.closeTicket(selectedTicket.id);
      setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
      toast.success(t('support.ticketDetails.closedSuccess', 'تم إغلاق التذكرة بنجاح.'));
      fetchUserTickets();
    } catch (err: any) {
      toast.error('فشل إغلاق التذكرة');
    }
  };

  // Helpers for Status & Priority Badges
  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30">{t('support.status.open', 'مفتوحة')}</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30">{t('support.status.in_progress', 'قيد المعالجة')}</Badge>;
      case 'waiting_for_info':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30">{t('support.status.waiting_for_info', 'بانتظار معلومات')}</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">{t('support.status.resolved', 'محلولة')}</Badge>;
      case 'closed':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30">{t('support.status.closed', 'مغلقة')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30">{t('support.priority.urgent', 'عاجلة')}</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30">{t('support.priority.high', 'مرتفعة')}</Badge>;
      case 'medium':
        return <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 hover:bg-sky-500/30">{t('support.priority.medium', 'متوسطة')}</Badge>;
      case 'low':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30">{t('support.priority.low', 'منخفضة')}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getCategoryLabel = (cat: TicketCategory) => {
    return t(`support.category.${cat}`, cat);
  };

  const sampleQuestions = [
    t('support.ai.q1', 'كيف يمكنني شحن رصيد المحفظة عبر USDT؟'),
    t('support.ai.q2', 'ما هي شروط وإجراءات توثيق الهوية KYC؟'),
    t('support.ai.q3', 'ما هي ميزات باقة Core بقيمة 30$؟'),
    t('support.ai.q4', 'كيف يتم سحب الأرباح والعمولات؟')
  ];

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {t('support.title', 'مركز الدعم الفني والمساعد الذكي')}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('support.subtitle', 'نحن هنا لمساعدتك والإجابة عن كافة استفساراتك حول منصة Nexyvora على مدار الساعة')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setActiveTab('new')}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/20"
            >
              <PlusCircle className="w-4 h-4" />
              {t('support.newTicketTab', 'فتح تذكرة جديدة')}
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
          <TabsList className="grid grid-cols-3 max-w-md bg-muted/60 p-1 border border-border/50">
            <TabsTrigger value="ai" className="gap-2 text-xs sm:text-sm">
              <Bot className="w-4 h-4 text-primary" />
              {t('support.aiTab', 'المساعد الذكي')}
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2 text-xs sm:text-sm">
              <Ticket className="w-4 h-4 text-amber-500" />
              {t('support.ticketsTab', 'تذاكري')}
              {tickets.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-primary/20 text-primary rounded-full">
                  {tickets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-2 text-xs sm:text-sm">
              <PlusCircle className="w-4 h-4 text-emerald-500" />
              {t('support.newTicketTab', 'تذكرة جديدة')}
            </TabsTrigger>
          </TabsList>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 1: AI ASSISTANT                                                 */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="ai" className="space-y-4 mt-6">
            <Card className="border-border/60 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white shadow-md shadow-primary/20">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        {t('support.ai.welcomeTitle', 'المساعد الذكي لمنصة Nexyvora')}
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                          AI Powered
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t('support.ai.financialDisclaimer', 'إرشادات فورية موثوقة من دليل المنصة. لا يقدم نصائح مالية.')}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChatMessages([chatMessages[0]])}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    محادثة جديدة
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4">
                {/* Messages Container */}
                <div className="space-y-4 max-h-[500px] min-h-[350px] overflow-y-auto pr-2 pl-1">
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm text-sm space-y-2 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-muted/60 border border-border/50 text-foreground rounded-tl-none'
                        }`}
                      >
                        <div className="whitespace-pre-line leading-relaxed">
                          {msg.content}
                        </div>

                        {/* Escalate button if AI suggested or enabled */}
                        {msg.role === 'assistant' && msg.canEscalate && (
                          <div className="pt-2 mt-2 border-t border-border/40 flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEscalateToTicket(msg.content)}
                              className="text-xs h-7 gap-1.5 border-primary/40 text-primary hover:bg-primary hover:text-white"
                            >
                              <LifeBuoy className="w-3.5 h-3.5" />
                              {t('support.ai.escalateBtn', 'تحويل إلى تذكرة دعم بشري')}
                            </Button>
                          </div>
                        )}

                        <div className={`text-[10px] ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {msg.timestamp}
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground border border-border/50 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {aiLoading && (
                    <div className="flex gap-3 justify-start items-center text-xs text-muted-foreground">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="p-3 rounded-2xl bg-muted/60 border border-border/40 text-muted-foreground rounded-tl-none flex items-center gap-2">
                        <span>{t('support.ai.thinking', 'جاري البحث في دليل Nexyvora وتجهيز الإجابة...')}</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Question Chips */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileQuestion className="w-3.5 h-3.5" />
                    <span>{t('support.ai.sampleQuestions', 'أسئلة شائعة يمكنك النقر عليها مباشرة:')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sampleQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendAiMessage(q)}
                        disabled={aiLoading}
                        className="text-xs bg-muted/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border/50 rounded-full px-3 py-1.5 transition-all text-start"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Bar */}
                <div className="flex items-center gap-2 pt-2">
                  <Input
                    value={inputQuestion}
                    onChange={e => setInputQuestion(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAiMessage();
                      }
                    }}
                    placeholder={t('support.ai.inputPlaceholder', 'اكتب سؤالك هنا... (مثال: كيف أسحب أرباحي؟ أو ما هي باقة Core 30$؟)')}
                    disabled={aiLoading}
                    className="flex-1 bg-background/80 border-border/60 focus-visible:ring-primary h-11"
                  />
                  <Button
                    onClick={() => handleSendAiMessage()}
                    disabled={!inputQuestion.trim() || aiLoading}
                    className="h-11 px-5 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span className="hidden sm:inline">{t('support.ai.send', 'إرسال')}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 2: MY TICKETS                                                   */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="tickets" className="space-y-4 mt-6">
            {/* Status Filter Chips */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all', label: t('support.status.all', 'جميع الحالات') },
                  { key: 'open', label: t('support.status.open', 'مفتوحة') },
                  { key: 'in_progress', label: t('support.status.in_progress', 'قيد المعالجة') },
                  { key: 'waiting_for_info', label: t('support.status.waiting_for_info', 'بانتظار معلومات') },
                  { key: 'resolved', label: t('support.status.resolved', 'محلولة') },
                  { key: 'closed', label: t('support.status.closed', 'مغلقة') },
                ].map(item => (
                  <Button
                    key={item.key}
                    size="sm"
                    variant={statusFilter === item.key ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(item.key)}
                    className="h-8 text-xs rounded-full"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={fetchUserTickets}
                disabled={loadingTickets}
                className="gap-1.5 text-xs text-muted-foreground"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>

            {loadingTickets ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs">جاري تحميل تذاكر الدعم...</p>
              </div>
            ) : tickets.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-border/80">
                <div className="w-14 h-14 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold mb-1">
                  {t('support.emptyTickets', 'لا توجد أي تذاكر دعم حالياً')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
                  إذا واجهت أي استفسار أو مشكلة في حسابك، يمكنك فتح تذكرة جديدة وسيقوم فريق الدعم بمتابعتها.
                </p>
                <Button
                  onClick={() => setActiveTab('new')}
                  className="gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  {t('support.openFirstTicket', 'فتح أول تذكرة دعم')}
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {tickets.map(ticket => (
                  <Card
                    key={ticket.id}
                    onClick={() => handleOpenTicketDetails(ticket)}
                    className="p-4 hover:border-primary/50 transition-all cursor-pointer border-border/60 bg-card/60 backdrop-blur-sm group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
                            {ticket.ticket_number}
                          </span>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted/40">
                            {getCategoryLabel(ticket.category)}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                          {ticket.subject}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(ticket.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {ticket.message_count || 1} ردود
                          </span>
                          {ticket.last_reply_by === 'admin' && (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                              رد جديد من الإدارة
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end sm:justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs group-hover:bg-primary/10 group-hover:text-primary"
                        >
                          عرض التفاصيل
                          {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 3: CREATE NEW TICKET                                            */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="new" className="mt-6">
            <Card className="max-w-3xl mx-auto border-border/60 shadow-xl bg-card/80 backdrop-blur-xl">
              <CardHeader className="border-b border-border/40 pb-5">
                <CardTitle className="text-xl flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-primary" />
                  {t('support.createTicket.title', 'فتح تذكرة دعم فني جديدة')}
                </CardTitle>
                <CardDescription>
                  {t('support.createTicket.desc', 'يرجى تحديد الموضوع واختيار الأولوية المناسبة وشرح المشكلة بالتفصيل لمساعدتك بأفضل شكل.')}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={handleCreateTicketSubmit} className="space-y-5">
                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="font-semibold text-sm">
                      {t('support.createTicket.subjectLabel', 'عنوان التذكرة / الموضوع')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="subject"
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                      placeholder={t('support.createTicket.subjectPlaceholder', 'مثال: استفسار عن تفعيل باقة أو تأخر وصول سحب...')}
                      required
                      className="bg-background/60 focus-visible:ring-primary"
                    />
                  </div>

                  {/* Category & Priority Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="font-semibold text-sm">
                        {t('support.createTicket.categoryLabel', 'قسم الدعم')}
                      </Label>
                      <select
                        id="category"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value as TicketCategory)}
                        className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="general">{t('support.category.general', 'استفسار عام')}</option>
                        <option value="wallet">{t('support.category.wallet', 'المحفظة والسحب والإيداع')}</option>
                        <option value="billing">{t('support.category.billing', 'المالية والمدفوعات')}</option>
                        <option value="academy">{t('support.category.academy', 'التكوينات والدورات')}</option>
                        <option value="kyc">{t('support.category.kyc', 'توثيق الحساب والهوية')}</option>
                        <option value="technical">{t('support.category.technical', 'مشكلة تقنية / الموقع')}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority" className="font-semibold text-sm">
                        {t('support.createTicket.priorityLabel', 'درجة الأولوية')}
                      </Label>
                      <select
                        id="priority"
                        value={newPriority}
                        onChange={e => setNewPriority(e.target.value as TicketPriority)}
                        className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="low">{t('support.priority.low', 'منخفضة')}</option>
                        <option value="medium">{t('support.priority.medium', 'متوسطة')}</option>
                        <option value="high">{t('support.priority.high', 'مرتفعة')}</option>
                        <option value="urgent">{t('support.priority.urgent', 'عاجلة')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Message Description */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="font-semibold text-sm">
                      {t('support.createTicket.messageLabel', 'تفاصيل المشكلة أو الاستفسار')} <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      rows={6}
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder={t('support.createTicket.messagePlaceholder', 'اشرح المشكلة بالتفصيل، وأرفق أي أرقام مرجعية إذا كانت متوفرة...')}
                      required
                      className="bg-background/60 focus-visible:ring-primary resize-y"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('tickets')}
                      disabled={creatingTicket}
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      disabled={creatingTicket}
                      className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/20"
                    >
                      {creatingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {t('support.createTicket.submitBtn', 'إرسال التذكرة الآن')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TICKET DETAILS & CONVERSATION MODAL                                 */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/80">
            {selectedTicket && (
              <>
                {/* Header */}
                <div className="p-5 border-b border-border/60 bg-muted/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-muted text-foreground border border-border/50">
                        {selectedTicket.ticket_number}
                      </span>
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                      <span className="text-xs text-muted-foreground">
                        {getCategoryLabel(selectedTicket.category)}
                      </span>
                    </div>

                    {selectedTicket.status !== 'closed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCloseTicket}
                        className="text-xs h-7 text-muted-foreground hover:text-destructive hover:border-destructive/40"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {t('support.ticketDetails.closeTicket', 'إغلاق التذكرة')}
                      </Button>
                    )}
                  </div>

                  <h3 className="font-bold text-lg text-foreground">
                    {selectedTicket.subject}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    تاريخ الإنشاء: {new Date(selectedTicket.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>

                {/* Conversation Thread */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[50vh]">
                  {loadingThread ? (
                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <p className="text-xs">جاري تحميل الرسائل...</p>
                    </div>
                  ) : ticketMessages.length === 0 ? (
                    <div className="text-center p-6 text-muted-foreground text-xs">
                      لا توجد رسائل سابقة.
                    </div>
                  ) : (
                    ticketMessages.map(msg => {
                      const isAdmin = msg.sender_role === 'admin';
                      return (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-xl space-y-2 border ${
                            isAdmin
                              ? 'bg-primary/5 border-primary/20 shadow-sm'
                              : 'bg-muted/40 border-border/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isAdmin ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-bold text-xs text-primary">
                                    {t('support.ticketDetails.adminBadge', 'فريق الدعم الفني والإدارة')}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">
                                    <User className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-semibold text-xs text-foreground">
                                    {msg.sender_name || user?.email || t('support.ticketDetails.userBadge', 'العضو')}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>

                          <div className="text-sm text-foreground whitespace-pre-line leading-relaxed pl-8">
                            {msg.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply Footer */}
                <div className="p-4 border-t border-border/60 bg-muted/20 space-y-3">
                  {selectedTicket.status === 'closed' ? (
                    <div className="p-3 rounded-lg bg-muted text-center text-xs text-muted-foreground border border-border/40">
                      {t('support.ticketDetails.closedNotice', 'هذه التذكرة مغلقة حالياً. إذا كانت لديك مشكلة جديدة يرجى فتح تذكرة أخرى.')}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        rows={3}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder={t('support.ticketDetails.replyPlaceholder', 'اكتب ردك هنا...')}
                        className="bg-background/80 resize-none text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={handleSendReply}
                          disabled={!replyText.trim() || sendingReply}
                          className="gap-2"
                        >
                          {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {t('support.ticketDetails.sendReply', 'إرسال الرد')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
