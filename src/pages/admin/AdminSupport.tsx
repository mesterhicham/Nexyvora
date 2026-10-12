import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  LifeBuoy, 
  Search, 
  Filter, 
  RefreshCw, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  User, 
  Send, 
  Loader2, 
  ShieldCheck, 
  ShieldAlert, 
  Inbox, 
  Layers, 
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Mail,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { supportService } from '@/services/apiService';
import { SupportTicket, SupportMessage, SupportStats, TicketCategory, TicketPriority, TicketStatus } from '@/types';

export default function AdminSupport() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // ─── State ──────────────────────────────────────────────────────────────────
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    waiting_for_info: 0,
    resolved: 0,
    closed: 0,
    urgent: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);

  // Selected Ticket & Thread Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<string>('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [statusFilter, priorityFilter, categoryFilter, page]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const res = await supportService.adminGetStats();
      setStats(res);
    } catch (err: any) {
      console.error('Failed to load stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 30 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (search.trim()) params.search = search.trim();

      const res = await supportService.adminGetTickets(params);
      setTickets(res.tickets || []);
      setTotalTickets(res.total || 0);
    } catch (err: any) {
      toast.error(t('support.loadError', 'فشل تحميل تذاكر الدعم'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTickets();
  };

  const handleOpenTicketModal = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setReplyStatus(ticket.status === 'open' ? 'in_progress' : ticket.status);
    try {
      setLoadingThread(true);
      const res = await supportService.getTicketDetails(ticket.id);
      setSelectedTicket(res.ticket);
      setTicketMessages(res.messages || []);
    } catch (err: any) {
      toast.error('فشل في تحميل تفاصيل التذكرة');
    } finally {
      setLoadingThread(false);
    }
  };

  const handleAdminUpdateStatus = async (newStatus: TicketStatus) => {
    if (!selectedTicket || updatingStatus) return;
    try {
      setUpdatingStatus(true);
      await supportService.adminUpdateStatus(selectedTicket.id, newStatus);
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(t('support.ticketDetails.statusUpdated', 'تم تحديث حالة التذكرة بنجاح.'));
      loadTickets();
      loadStats();
    } catch (err: any) {
      toast.error('فشل تحديث الحالة');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAdminUpdatePriority = async (newPriority: TicketPriority) => {
    if (!selectedTicket || updatingPriority) return;
    try {
      setUpdatingPriority(true);
      await supportService.adminUpdatePriority(selectedTicket.id, newPriority);
      setSelectedTicket(prev => prev ? { ...prev, priority: newPriority } : null);
      toast.success(t('support.ticketDetails.priorityUpdated', 'تم تحديث أولوية التذكرة بنجاح.'));
      loadTickets();
    } catch (err: any) {
      toast.error('فشل تحديث الأولوية');
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleSendAdminReply = async () => {
    if (!selectedTicket || !adminReplyText.trim() || sendingReply) return;
    try {
      setSendingReply(true);
      const res = await supportService.addMessage(selectedTicket.id, {
        message: adminReplyText.trim(),
        status: replyStatus || selectedTicket.status
      });

      setTicketMessages(prev => [...prev, res.newMessage]);
      setAdminReplyText('');
      if (res.newStatus) {
        setSelectedTicket(prev => prev ? { ...prev, status: res.newStatus } : null);
      }
      toast.success('تم إرسال الرد بنجاح.');
      loadTickets();
      loadStats();
    } catch (err: any) {
      toast.error('فشل في إرسال الرد');
    } finally {
      setSendingReply(false);
    }
  };

  // Badge helpers
  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{t('support.status.open', 'مفتوحة')}</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{t('support.status.in_progress', 'قيد المعالجة')}</Badge>;
      case 'waiting_for_info':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">{t('support.status.waiting_for_info', 'بانتظار معلومات')}</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{t('support.status.resolved', 'محلولة')}</Badge>;
      case 'closed':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{t('support.status.closed', 'مغلقة')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold">{t('support.priority.urgent', 'عاجلة')}</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">{t('support.priority.high', 'مرتفعة')}</Badge>;
      case 'medium':
        return <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30">{t('support.priority.medium', 'متوسطة')}</Badge>;
      case 'low':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{t('support.priority.low', 'منخفضة')}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getCategoryLabel = (cat: TicketCategory) => {
    return t(`support.category.${cat}`, cat);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {t('support.adminTitle', 'إدارة تذاكر الدعم الفني')}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('support.adminSubtitle', 'متابعة وإدارة تذاكر الدعم الفني للأعضاء، الرد المباشر، وتحديث الحالات والأولويات.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { loadTickets(); loadStats(); }}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </div>

        {/* ─── Statistics Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium">{t('support.stats.total', 'إجمالي التذاكر')}</span>
              <span className="text-2xl font-black mt-2">{stats.total}</span>
            </CardContent>
          </Card>

          {/* Open */}
          <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-500 font-medium">{t('support.stats.open', 'مفتوحة')}</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <span className="text-2xl font-black text-amber-400 mt-2">{stats.open}</span>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card className="border-blue-500/20 bg-blue-500/5 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-xs text-blue-400 font-medium">{t('support.stats.inProgress', 'قيد المعالجة')}</span>
              <span className="text-2xl font-black text-blue-400 mt-2">{stats.in_progress}</span>
            </CardContent>
          </Card>

          {/* Waiting for Info */}
          <Card className="border-purple-500/20 bg-purple-500/5 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-xs text-purple-400 font-medium">{t('support.stats.waitingForInfo', 'بانتظار معلومات')}</span>
              <span className="text-2xl font-black text-purple-400 mt-2">{stats.waiting_for_info}</span>
            </CardContent>
          </Card>

          {/* Resolved */}
          <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-xs text-emerald-400 font-medium">{t('support.stats.resolved', 'محلولة')}</span>
              <span className="text-2xl font-black text-emerald-400 mt-2">{stats.resolved}</span>
            </CardContent>
          </Card>

          {/* Urgent */}
          <Card className="border-rose-500/20 bg-rose-500/5 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-rose-400 font-medium">{t('support.stats.urgent', 'عاجلة')}</span>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <span className="text-2xl font-black text-rose-400 mt-2">{stats.urgent}</span>
            </CardContent>
          </Card>
        </div>

        {/* ─── Search & Filters Bar ─────────────────────────────────────────── */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث برقم التذكرة، العنوان، اسم العضو، أو البريد الإلكتروني..."
                className="pl-9 rtl:pl-3 rtl:pr-9 bg-background/80"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-md bg-background border border-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">كل الحالات</option>
              <option value="open">مفتوحة</option>
              <option value="in_progress">قيد المعالجة</option>
              <option value="waiting_for_info">بانتظار معلومات</option>
              <option value="resolved">محلولة</option>
              <option value="closed">مغلقة</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-md bg-background border border-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">كل الأولويات</option>
              <option value="urgent">عاجلة</option>
              <option value="high">مرتفعة</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-md bg-background border border-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">كل الأقسام</option>
              <option value="general">عام</option>
              <option value="wallet">المحفظة والسحب</option>
              <option value="billing">المالية والمدفوعات</option>
              <option value="academy">التكوينات</option>
              <option value="kyc">توثيق الهوية</option>
              <option value="technical">مشكلة تقنية</option>
            </select>

            <Button type="submit" className="gap-2 shrink-0">
              <Filter className="w-4 h-4" />
              تصفية
            </Button>
          </form>
        </Card>

        {/* ─── Tickets Table / List ─────────────────────────────────────────── */}
        <Card className="border-border/60 overflow-hidden shadow-xl bg-card/80 backdrop-blur-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-muted-foreground space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">جاري تحميل تذاكر الدعم...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                <Inbox className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">لا توجد أي تذاكر مطابقة لخيارات البحث</h3>
              <p className="text-xs text-muted-foreground">جرب تغيير شروط التصفية أو مسح كلمة البحث.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground">
                  <tr>
                    <th className="p-3.5 text-start font-semibold">رقم التذكرة</th>
                    <th className="p-3.5 text-start font-semibold">العضو</th>
                    <th className="p-3.5 text-start font-semibold">الموضوع والقسم</th>
                    <th className="p-3.5 text-start font-semibold">الأولوية</th>
                    <th className="p-3.5 text-start font-semibold">الحالة</th>
                    <th className="p-3.5 text-start font-semibold">آخر نشاط</th>
                    <th className="p-3.5 text-center font-semibold">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {tickets.map(ticket => (
                    <tr
                      key={ticket.id}
                      onClick={() => handleOpenTicketModal(ticket)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      {/* Ticket Number */}
                      <td className="p-3.5 font-mono font-bold text-foreground whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-muted border border-border/50 text-xs">
                          {ticket.ticket_number}
                        </span>
                      </td>

                      {/* User */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {ticket.user_name ? ticket.user_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-xs sm:text-sm">
                              {ticket.user_name || 'عضو'}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {ticket.user_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Subject & Category */}
                      <td className="p-3.5 max-w-xs">
                        <div className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {ticket.subject}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">
                            {getCategoryLabel(ticket.category)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            • {ticket.message_count || 1} رسائل
                          </span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="p-3.5 whitespace-nowrap">
                        {getPriorityBadge(ticket.priority)}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        {getStatusBadge(ticket.status)}
                      </td>

                      {/* Last Activity */}
                      <td className="p-3.5 whitespace-nowrap text-xs text-muted-foreground">
                        <div>
                          {new Date(ticket.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px]">
                          بواسطة: {ticket.last_reply_by === 'admin' ? 'الإدارة' : 'العضو'}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1 group-hover:bg-primary/10 group-hover:text-primary"
                        >
                          معاينة
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ─── TICKET DETAILS & REPLY MODAL ─────────────────────────────────── */}
        <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/80">
            {selectedTicket && (
              <>
                {/* Modal Header */}
                <div className="p-5 border-b border-border/60 bg-muted/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm px-2.5 py-1 rounded bg-muted text-foreground border border-border/50">
                        {selectedTicket.ticket_number}
                      </span>
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted/40">
                        {getCategoryLabel(selectedTicket.category)}
                      </span>
                    </div>

                    {/* Quick status & priority selectors for Admin */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-muted-foreground">الحالة:</Label>
                        <select
                          value={selectedTicket.status}
                          disabled={updatingStatus}
                          onChange={e => handleAdminUpdateStatus(e.target.value as TicketStatus)}
                          className="h-8 px-2 rounded bg-background border border-border text-xs focus:ring-1 focus:ring-primary"
                        >
                          <option value="open">مفتوحة</option>
                          <option value="in_progress">قيد المعالجة</option>
                          <option value="waiting_for_info">بانتظار معلومات</option>
                          <option value="resolved">محلولة</option>
                          <option value="closed">مغلقة</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-muted-foreground">الأولوية:</Label>
                        <select
                          value={selectedTicket.priority}
                          disabled={updatingPriority}
                          onChange={e => handleAdminUpdatePriority(e.target.value as TicketPriority)}
                          className="h-8 px-2 rounded bg-background border border-border text-xs focus:ring-1 focus:ring-primary"
                        >
                          <option value="urgent">عاجلة</option>
                          <option value="high">مرتفعة</option>
                          <option value="medium">متوسطة</option>
                          <option value="low">منخفضة</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-bold text-xl text-foreground mb-1">
                    {selectedTicket.subject}
                  </h3>

                  {/* User Info Bar */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      صاحب التذكرة: <strong className="text-foreground">{selectedTicket.user_name || 'عضو'}</strong> ({selectedTicket.user_email})
                    </span>
                    <span>•</span>
                    <span>تاريخ الفتح: {new Date(selectedTicket.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Conversation Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[50vh]">
                  {loadingThread ? (
                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <p className="text-xs">جاري تحميل سجل المحادثة...</p>
                    </div>
                  ) : ticketMessages.length === 0 ? (
                    <div className="text-center p-6 text-muted-foreground text-xs">
                      لا توجد رسائل مسجلة.
                    </div>
                  ) : (
                    ticketMessages.map(msg => {
                      const isAdmin = msg.sender_role === 'admin';
                      return (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-xl space-y-2 border ${
                            isAdmin
                              ? 'bg-primary/10 border-primary/30 shadow-sm'
                              : 'bg-muted/40 border-border/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isAdmin ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs shadow-sm">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-bold text-xs text-primary">
                                    رد الإدارة والدعم الفني ({msg.sender_name || 'Admin'})
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">
                                    <User className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-bold text-xs text-foreground">
                                    {msg.sender_name || selectedTicket.user_name || 'العضو'}
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

                {/* Admin Reply Input & Action Bar */}
                <div className="p-4 border-t border-border/60 bg-muted/20 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-foreground">
                        الرد على التذكرة وتحديث حالتها:
                      </Label>

                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">تعيين الحالة بعد الرد:</Label>
                        <select
                          value={replyStatus}
                          onChange={e => setReplyStatus(e.target.value)}
                          className="h-7 px-2 rounded bg-background border border-border text-xs focus:ring-1 focus:ring-primary"
                        >
                          <option value="in_progress">قيد المعالجة (In Progress)</option>
                          <option value="waiting_for_info">بانتظار معلومات من العضو (Waiting for Info)</option>
                          <option value="resolved">محلولة (Resolved)</option>
                          <option value="closed">إغلاق التذكرة (Closed)</option>
                        </select>
                      </div>
                    </div>

                    <Textarea
                      rows={3}
                      value={adminReplyText}
                      onChange={e => setAdminReplyText(e.target.value)}
                      placeholder="اكتب رد الإدارة الرسمي هنا ليظهر للعضو في حسابه..."
                      className="bg-background/90 resize-none text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      onClick={handleSendAdminReply}
                      disabled={!adminReplyText.trim() || sendingReply}
                      className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                    >
                      {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      إرسال الرد وتحديث الحالة
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
