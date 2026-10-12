import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { 
  useAllPayments,
  useUpdatePaymentStatus,
  useProgramPricing,
  useUpsertProgramPricing,
  usePrograms,
} from '@/hooks/usePaymentFlow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/apiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  CreditCard, 
  Check, 
  X, 
  Clock, 
  DollarSign,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Building2,
  Wallet,
  Phone,
  Save,
  Download,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  Receipt,
  ExternalLink,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const CURRENCY_SYMBOLS: Record<string, string> = {
  MAD: 'DH',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: 'ر.س',
  AED: 'د.إ',
};

const formatCurrency = (amount: number | string | any, currency: string = 'USD') => {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount ?? 0));
  const validNum = isNaN(num) ? 0 : num;
  const symbol = CURRENCY_SYMBOLS[currency] || currency || '$';
  return `${symbol} ${validNum.toFixed(2)}`;
};

const safeFormatDate = (dateStr: any, formatStr: string = 'PP') => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return format(d, formatStr);
  } catch {
    return '-';
  }
};

const getStudentName = (p: any) => p?.full_name || p?.students?.profiles?.full_name || 'Unknown Student';
const getStudentEmail = (p: any) => p?.email || p?.students?.profiles?.email || '';
const getProgramName = (p: any) => p?.program_name || p?.programs?.name || '-';

interface PaymentAccountSettings {
  id?: string;
  payment_method: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  iban: string;
  swift_bic: string;
  bank_address: string;
  paypal_email: string;
  stripe_publishable_key: string;
  stripe_account_id: string;
  mobile_payment_number: string;
  mobile_payment_provider: string;
  instructions: string;
  is_active: boolean;
}

const defaultAccountSettings: PaymentAccountSettings = {
  payment_method: 'bank_transfer',
  bank_name: '',
  account_holder_name: '',
  account_number: '',
  iban: '',
  swift_bic: '',
  bank_address: '',
  paypal_email: '',
  stripe_publishable_key: '',
  stripe_account_id: '',
  mobile_payment_number: '',
  mobile_payment_provider: '',
  instructions: '',
  is_active: true,
};

function usePaymentAccountSettings() {
  return useQuery({
    queryKey: ['payment-account-settings'],
    queryFn: async () => {
      try {
        const data = await adminService.getPaymentAccountSettings();
        return data as PaymentAccountSettings | null;
      } catch {
        return null;
      }
    },
    retry: 1,
  });
}

function useSavePaymentAccountSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: PaymentAccountSettings) => {
      return adminService.savePaymentAccountSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-account-settings'] });
      toast.success('Payment account settings saved!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });
}


export default function PaymentsManagement() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { data: payments, isLoading: loadingPayments } = useAllPayments();
  const { data: pricing, isLoading: loadingPricing } = useProgramPricing();
  const { data: programs } = usePrograms();
  const { data: accountSettings, isLoading: loadingAccountSettings } = usePaymentAccountSettings();
  const updatePaymentStatus = useUpdatePaymentStatus();
  const upsertPricing = useUpsertProgramPricing();
  const saveAccountSettings = useSavePaymentAccountSettings();
  
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [accountForm, setAccountForm] = useState<PaymentAccountSettings>(defaultAccountSettings);
  const [receiptModalUrl, setReceiptModalUrl] = useState<string | null>(null);
  
  // Date range filter state
  const [dateRangePreset, setDateRangePreset] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (accountSettings) {
      setAccountForm(accountSettings);
    }
  }, [accountSettings]);

  // Filter payments by date range
  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    
    let start: Date | null = null;
    let end: Date | null = null;
    
    if (dateRangePreset === 'custom' && startDate && endDate) {
      start = startOfDay(new Date(startDate));
      end = endOfDay(new Date(endDate));
    } else if (dateRangePreset === 'today') {
      start = startOfDay(new Date());
      end = endOfDay(new Date());
    } else if (dateRangePreset === '7days') {
      start = startOfDay(subDays(new Date(), 7));
      end = endOfDay(new Date());
    } else if (dateRangePreset === '30days') {
      start = startOfDay(subDays(new Date(), 30));
      end = endOfDay(new Date());
    } else if (dateRangePreset === 'thisMonth') {
      start = startOfMonth(new Date());
      end = endOfMonth(new Date());
    } else if (dateRangePreset === 'lastMonth') {
      const lastMonth = subMonths(new Date(), 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
    }
    
    if (!start || !end) return payments;
    
    return payments.filter(p => {
      if (!p.created_at) return false;
      const paymentDate = new Date(p.created_at);
      if (isNaN(paymentDate.getTime())) return false;
      return isWithinInterval(paymentDate, { start, end });
    });
  }, [payments, dateRangePreset, startDate, endDate]);

  const pendingPayments = payments?.filter(p => p.status === 'pending') || [];
  const processedPayments = payments?.filter(p => p.status !== 'pending') || [];

  // Chart colors
  const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
  const PIE_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444'];

  // Monthly revenue data for the last 6 months
  const monthlyRevenueData = useMemo(() => {
    if (!payments?.length) return [];
    
    const months: { month: string; revenue: number; count: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthLabel = format(date, 'MMM yyyy');
      
      const monthPayments = payments.filter(p => {
        if (!p.created_at || p.status !== 'approved') return false;
        try {
          const paymentDate = parseISO(String(p.created_at));
          if (isNaN(paymentDate.getTime())) return false;
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        } catch {
          return false;
        }
      });
      
      const revenue = monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
      months.push({
        month: monthLabel,
        revenue: Math.round(revenue * 100) / 100,
        count: monthPayments.length,
      });
    }
    
    return months;
  }, [payments]);

  // Payment method distribution
  const methodDistributionData = useMemo(() => {
    if (!payments?.length) return [];
    
    const methodCounts: Record<string, number> = {};
    
    payments.forEach(p => {
      const method = p.payment_method || 'unknown';
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });
    
    return Object.entries(methodCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [payments]);

  // Status distribution
  const statusDistributionData = useMemo(() => {
    if (!payments?.length) return [];
    
    const statusCounts: Record<string, number> = {};
    
    payments.forEach(p => {
      const status = p.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [payments]);

  // Summary stats
  const stats = useMemo(() => {
    if (!payments?.length) return { total: 0, approved: 0, pending: 0, rejected: 0, totalRevenue: 0 };
    
    const approved = payments.filter(p => p.status === 'approved');
    const pending = payments.filter(p => p.status === 'pending');
    const rejected = payments.filter(p => p.status === 'rejected');
    const totalRevenue = approved.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    return {
      total: payments.length,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    };
  }, [payments]);

  const handleReview = async (action: 'approved' | 'rejected') => {
    if (!selectedPayment) return;
    
    await updatePaymentStatus.mutateAsync({
      id: selectedPayment.id,
      status: action,
      adminNotes,
    });
    
    setSelectedPayment(null);
    setAdminNotes('');
    setReviewAction(null);
  };

  const handlePriceUpdate = async (programId: string) => {
    const price = parseFloat(priceInputs[programId] || '0');
    if (isNaN(price) || price < 0) {
      toast.error('Invalid price');
      return;
    }
    
    await upsertPricing.mutateAsync({ program_id: programId, price });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900/60">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'approved':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900/60">
            <CheckCircle className="h-3 w-3" /> {status === 'approved' ? 'Approved' : 'Completed'}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/60">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'manual':
        return <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Manual</span>;
      case 'stripe':
        return <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-mono font-semibold bg-purple-100/70 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">Stripe</span>;
      case 'paypal':
        return <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-mono font-semibold bg-sky-100/70 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">PayPal</span>;
      default:
        return <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{method}</span>;
    }
  };

  const exportToCSV = () => {
    if (!payments?.length) {
      toast.error('No payments to export');
      return;
    }

    const headers = ['Student Name', 'Email', 'Program', 'Amount', 'Currency', 'Method', 'Status', 'Reference', 'Date', 'Admin Notes'];
    const rows = payments.map(payment => [
      getStudentName(payment),
      getStudentEmail(payment),
      getProgramName(payment),
      payment.amount,
      payment.currency || 'USD',
      payment.payment_method,
      payment.status,
      payment.reference_number || '',
      safeFormatDate(payment.created_at, 'yyyy-MM-dd HH:mm'),
      payment.admin_notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payments-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('CSV exported successfully!');
  };

  const exportToPDF = () => {
    if (!payments?.length) {
      toast.error('No payments to export');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.text('Payments Report', pageWidth / 2, 20, { align: 'center' });
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, pageWidth / 2, 28, { align: 'center' });
    
    // Summary
    doc.setFontSize(12);
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount as number || 0), 0);
    const approvedCount = payments.filter(p => p.status === 'approved').length;
    const pendingCount = payments.filter(p => p.status === 'pending').length;
    const rejectedCount = payments.filter(p => p.status === 'rejected').length;
    
    doc.text('Summary:', 14, 40);
    doc.setFontSize(10);
    doc.text(`Total Payments: ${payments.length}`, 14, 48);
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 14, 54);
    doc.text(`Approved: ${approvedCount} | Pending: ${pendingCount} | Rejected: ${rejectedCount}`, 14, 60);
    
    // Table header
    let yPos = 75;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Student', 14, yPos);
    doc.text('Program', 60, yPos);
    doc.text('Amount', 105, yPos);
    doc.text('Status', 135, yPos);
    doc.text('Date', 165, yPos);
    
    doc.setFont('helvetica', 'normal');
    yPos += 8;
    
    // Table rows
    payments.forEach((payment, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const studentName = getStudentName(payment).substring(0, 20);
      const programName = getProgramName(payment).substring(0, 18);
      const amount = formatCurrency(payment.amount, payment.currency || 'USD');
      const status = payment.status;
      const date = safeFormatDate(payment.created_at, 'MM/dd/yy');
      
      doc.text(studentName, 14, yPos);
      doc.text(programName, 60, yPos);
      doc.text(amount, 105, yPos);
      doc.text(status, 135, yPos);
      doc.text(date, 165, yPos);
      
      yPos += 6;
    });
    
    doc.save(`payments-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF exported successfully!');
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Payments Management"
        description="Review payments and manage program pricing"
        icon={CreditCard}
      />

      <div className="space-y-6">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1.5 rounded-2xl shadow-xs inline-flex gap-1.5 flex-wrap h-auto">
            <TabsTrigger value="pending" className="rounded-xl px-4 py-2 font-semibold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-xs transition-all">
              Pending Review
              {pendingPayments.length > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingPayments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-xl px-4 py-2 font-semibold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-xs transition-all">
              All Payments
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl px-4 py-2 font-semibold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-xs transition-all">
              <BarChart3 className="h-3.5 w-3.5 mr-1" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="pricing" className="rounded-xl px-4 py-2 font-semibold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-xs transition-all">
              Program Pricing
            </TabsTrigger>
            <TabsTrigger value="account" className="rounded-xl px-4 py-2 font-semibold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-xs transition-all">
              Account Settings
            </TabsTrigger>
          </TabsList>

          {/* Pending Payments */}
          <TabsContent value="pending">
            {loadingPayments ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingPayments.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">No payments pending review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map(payment => (
                  <Card key={payment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">
                              {getStudentName(payment)}
                            </h3>
                            {getMethodBadge(payment.payment_method)}
                            {getStatusBadge(payment.status)}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Email: {getStudentEmail(payment) || 'N/A'}</p>
                            <p>Program: {getProgramName(payment)}</p>
                            <p>Reference: {payment.reference_number || 'N/A'}</p>
                            <p>Submitted: {safeFormatDate(payment.created_at, 'PPP p')}</p>
                          </div>
                          {payment.receipt_url && (
                            <div className="mt-2">
                              <p className="text-sm font-medium mb-1">Receipt:</p>
                              <button 
                                type="button"
                                onClick={() => setReceiptModalUrl(payment.receipt_url)}
                                className="cursor-pointer"
                              >
                                <img 
                                  src={payment.receipt_url} 
                                  alt="Payment receipt" 
                                  className="max-w-[150px] max-h-[100px] object-cover rounded border hover:opacity-80 transition-opacity"
                                />
                              </button>
                            </div>
                          )}
                          {payment.notes && (
                            <p className="mt-2 text-sm bg-accent/50 p-2 rounded">
                              <strong>Notes:</strong> {payment.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary mb-4">
                            {formatCurrency(payment.amount as number, payment.currency || 'USD')}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setReviewAction('reject');
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setReviewAction('approve');
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* All Payments */}
          <TabsContent value="all">
            <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="space-y-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">All Payments</CardTitle>
                    <p className="text-xs text-slate-400 mt-0.5">Manage, track and filter all recorded platform payments</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={exportToCSV}
                      className="rounded-xl border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-semibold text-xs shadow-2xs"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                      Export CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={exportToPDF}
                      className="rounded-xl border-purple-200 dark:border-purple-900/60 bg-purple-50/80 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 font-semibold text-xs shadow-2xs"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      Export PDF
                    </Button>
                  </div>
                </div>
                
                {/* Date Range Filters */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter by date:</Label>
                  <Select value={dateRangePreset} onValueChange={(value) => {
                    setDateRangePreset(value);
                    if (value !== 'custom') {
                      setStartDate('');
                      setEndDate('');
                    }
                  }}>
                    <SelectTrigger className="w-[160px] rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                      <SelectItem value="lastMonth">Last Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {dateRangePreset === 'custom' && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-[150px] rounded-xl"
                      />
                      <span className="text-muted-foreground text-xs">to</span>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-[150px] rounded-xl"
                      />
                    </div>
                  )}
                  
                  {dateRangePreset !== 'all' && (
                    <Badge variant="secondary" className="ml-2 rounded-lg">
                      {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                    <TableRow className="border-b border-slate-100 dark:border-slate-800">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Student</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Program</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Currency</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Method</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No payments found for the selected date range
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getStudentName(payment)}</p>
                            <p className="text-sm text-muted-foreground">{getStudentEmail(payment) || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getProgramName(payment)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount, payment.currency || 'USD')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.currency || 'USD'}</Badge>
                        </TableCell>
                        <TableCell>{getMethodBadge(payment.payment_method)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>{safeFormatDate(payment.created_at, 'PP')}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">${stats.totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">From approved payments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                    <p className="text-xs text-muted-foreground">{stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% success rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <p className="text-xs text-muted-foreground">Awaiting review</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Revenue Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Monthly Revenue Trend
                    </CardTitle>
                    <CardDescription>Approved payment revenue over the last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyRevenueData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyRevenueData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                          />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No payment data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Count Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Monthly Payment Count
                    </CardTitle>
                    <CardDescription>Number of approved payments per month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyRevenueData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyRevenueData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number) => [value, 'Payments']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No payment data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Distribution Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Method Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method Distribution</CardTitle>
                    <CardDescription>Breakdown by payment method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {methodDistributionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={methodDistributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {methodDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No payment data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Status Distribution</CardTitle>
                    <CardDescription>Breakdown by payment status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statusDistributionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={statusDistributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {statusDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No payment data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Program Pricing */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Program Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {programs?.map(program => {
                    const programPrice = pricing?.find(p => p.program_id === program.id);
                    const currentPrice = priceInputs[program.id] ?? programPrice?.price?.toString() ?? '0';
                    
                    return (
                      <div key={program.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{program.name}</h3>
                          <p className="text-sm text-muted-foreground">{program.duration}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label>USD</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={currentPrice}
                            onChange={(e) => setPriceInputs(prev => ({ ...prev, [program.id]: e.target.value }))}
                            className="w-32"
                          />
                          <Button
                            size="sm"
                            onClick={() => handlePriceUpdate(program.id)}
                            disabled={upsertPricing.isPending}
                          >
                            {upsertPricing.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Payment Account Settings
                </CardTitle>
                <CardDescription>
                  Configure the account details for receiving payments from students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingAccountSettings ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select
                        value={accountForm.payment_method}
                        onValueChange={(value) => setAccountForm(prev => ({ ...prev, payment_method: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Bank Transfer
                            </div>
                          </SelectItem>
                          <SelectItem value="paypal">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4" />
                              PayPal
                            </div>
                          </SelectItem>
                          <SelectItem value="mobile_money">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Mobile Money
                            </div>
                          </SelectItem>
                          <SelectItem value="stripe">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Stripe
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {accountForm.payment_method === 'bank_transfer' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Label>Bank Name</Label>
                          <Input
                            value={accountForm.bank_name}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, bank_name: e.target.value }))}
                            placeholder="e.g., Chase Bank, Bank of America"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Holder Name</Label>
                          <Input
                            value={accountForm.account_holder_name}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, account_holder_name: e.target.value }))}
                            placeholder="Full name on account"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Number</Label>
                          <Input
                            value={accountForm.account_number}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, account_number: e.target.value }))}
                            placeholder="Account number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>IBAN (International)</Label>
                          <Input
                            value={accountForm.iban}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, iban: e.target.value }))}
                            placeholder="e.g., DE89 3704 0044 0532 0130 00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>SWIFT/BIC Code</Label>
                          <Input
                            value={accountForm.swift_bic}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, swift_bic: e.target.value }))}
                            placeholder="e.g., COBADEFFXXX"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Bank Address</Label>
                          <Input
                            value={accountForm.bank_address}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, bank_address: e.target.value }))}
                            placeholder="Full bank address"
                          />
                        </div>
                      </div>
                    )}

                    {accountForm.payment_method === 'paypal' && (
                      <div className="p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Label>PayPal Email</Label>
                          <Input
                            type="email"
                            value={accountForm.paypal_email}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, paypal_email: e.target.value }))}
                            placeholder="your-paypal@email.com"
                          />
                        </div>
                      </div>
                    )}

                    {accountForm.payment_method === 'mobile_money' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Label>Mobile Payment Provider</Label>
                          <Input
                            value={accountForm.mobile_payment_provider}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, mobile_payment_provider: e.target.value }))}
                            placeholder="e.g., M-Pesa, Orange Money, Wave"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input
                            value={accountForm.mobile_payment_number}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, mobile_payment_number: e.target.value }))}
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                      </div>
                    )}

                    {accountForm.payment_method === 'stripe' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Label>Stripe Account ID</Label>
                          <Input
                            value={accountForm.stripe_account_id}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, stripe_account_id: e.target.value }))}
                            placeholder="acct_..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Publishable Key</Label>
                          <Input
                            value={accountForm.stripe_publishable_key}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                            placeholder="pk_..."
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Payment Instructions</Label>
                      <Textarea
                        value={accountForm.instructions}
                        onChange={(e) => setAccountForm(prev => ({ ...prev, instructions: e.target.value }))}
                        placeholder="Additional instructions for students making payments..."
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Active</Label>
                        <p className="text-sm text-muted-foreground">Enable this payment method for students</p>
                      </div>
                      <Switch
                        checked={accountForm.is_active}
                        onCheckedChange={(checked) => setAccountForm(prev => ({ ...prev, is_active: checked }))}
                      />
                    </div>

                    <Button 
                      onClick={() => saveAccountSettings.mutate(accountForm)}
                      disabled={saveAccountSettings.isPending}
                      className="w-full"
                    >
                      {saveAccountSettings.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Account Settings
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!reviewAction && !!selectedPayment} onOpenChange={() => { setReviewAction(null); setSelectedPayment(null); setAdminNotes(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Payment' : 'Reject Payment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-accent/50 rounded-lg">
              <p><strong>Student:</strong> {getStudentName(selectedPayment)}</p>
              <p><strong>Amount:</strong> {formatCurrency(selectedPayment?.amount, selectedPayment?.currency || 'USD')}</p>
              <p><strong>Reference:</strong> {selectedPayment?.reference_number || 'N/A'}</p>
            </div>

            {selectedPayment?.receipt_url && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Receipt className="h-3.5 w-3.5 text-primary" />
                  <span>{isRtl ? 'وصل الأداء' : 'Payment Receipt'}</span>
                </Label>
                <div 
                  className="border rounded-lg overflow-hidden bg-muted/20 p-2 cursor-pointer max-w-[240px] group relative hover:border-primary transition-colors"
                  onClick={() => setReceiptModalUrl(selectedPayment.receipt_url)}
                >
                  <img 
                    src={selectedPayment.receipt_url} 
                    alt="Receipt preview" 
                    className="w-full max-h-36 object-contain rounded"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg text-white text-xs font-semibold gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'تكبير الصورة' : 'Zoom Image'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Admin Notes {reviewAction === 'reject' && '(reason for rejection)'}</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={reviewAction === 'reject' ? 'Please provide a reason for rejection...' : 'Optional notes...'}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReviewAction(null); setAdminNotes(''); }}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              onClick={() => handleReview(reviewAction === 'approve' ? 'approved' : 'rejected')}
              disabled={updatePaymentStatus.isPending}
            >
              {updatePaymentStatus.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : reviewAction === 'approve' ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              {reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment && !reviewAction} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>Payment Details</span>
            </DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Student</Label>
                  <p className="font-medium">{getStudentName(selectedPayment)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p>{getStudentEmail(selectedPayment) || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Program</Label>
                  <p>{getProgramName(selectedPayment)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-bold text-primary">{formatCurrency(selectedPayment.amount, selectedPayment.currency || 'USD')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Method</Label>
                  <p>{getMethodBadge(selectedPayment.payment_method)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>{getStatusBadge(selectedPayment.status)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reference</Label>
                  <p className="font-mono text-sm">{selectedPayment.reference_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p>{safeFormatDate(selectedPayment.created_at, 'PPP p')}</p>
                </div>
              </div>

              {/* Receipt Image / Proof of Payment Section */}
              <div className="border-t border-border pt-4">
                <Label className="text-sm font-semibold flex items-center gap-1.5 mb-2.5">
                  <Receipt className="h-4 w-4 text-primary" />
                  <span>{isRtl ? 'وصل الأداء' : 'Proof of Payment'}</span>
                </Label>
                {selectedPayment.receipt_url ? (
                  <div className="space-y-3">
                    <div 
                      className="border-2 border-border/80 hover:border-primary rounded-xl overflow-hidden bg-muted/20 p-2 cursor-pointer transition-all group relative max-w-sm"
                      onClick={() => setReceiptModalUrl(selectedPayment.receipt_url)}
                    >
                      <img 
                        src={selectedPayment.receipt_url} 
                        alt="Payment receipt" 
                        className="w-full max-h-64 object-contain rounded-lg group-hover:scale-[1.01] transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
                        <Eye className="w-4 h-4" />
                        <span>{isRtl ? 'انقر لتكبير الصورة' : 'Click to enlarge image'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="text-xs gap-1.5 h-8 font-medium"
                        onClick={() => setReceiptModalUrl(selectedPayment.receipt_url)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'معاينة مكبرة' : 'Preview Zoom'}</span>
                      </Button>
                      <a
                        href={selectedPayment.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline h-8 px-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'فتح في نافذة جديدة' : 'Open in new tab'}</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed rounded-xl text-center text-xs text-muted-foreground bg-muted/10">
                    {isRtl ? 'لا يوجد وصل أداء مرفق مع هذه الدفعة' : 'No receipt image attached'}
                  </div>
                )}
              </div>

              {selectedPayment.notes && (
                <div className="border-t border-border pt-3">
                  <Label className="text-muted-foreground">Student Notes</Label>
                  <p className="p-2 bg-accent/50 rounded mt-1">{selectedPayment.notes}</p>
                </div>
              )}
              {selectedPayment.admin_notes && (
                <div>
                  <Label className="text-muted-foreground">Admin Notes</Label>
                  <p className="p-2 bg-accent/50 rounded mt-1">{selectedPayment.admin_notes}</p>
                </div>
              )}
              {selectedPayment.reviewed_at && (
                <div>
                  <Label className="text-muted-foreground">Reviewed</Label>
                  <p>{safeFormatDate(selectedPayment.reviewed_at, 'PPP p')}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Lightbox Modal */}
      <Dialog open={!!receiptModalUrl} onOpenChange={() => setReceiptModalUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {receiptModalUrl && (
            <div className="flex flex-col items-center gap-4">
              <img 
                src={receiptModalUrl} 
                alt="Payment receipt" 
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
              <a 
                href={receiptModalUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Open in new tab
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
