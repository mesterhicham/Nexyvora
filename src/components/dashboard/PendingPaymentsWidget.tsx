import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePendingPayments, useQuickPaymentAction } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  Check, 
  X, 
  Clock, 
  ChevronRight,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';

const CURRENCY_SYMBOLS: Record<string, string> = {
  MAD: 'DH',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: 'ر.س',
  AED: 'د.إ',
};

const safeFormatDate = (dateVal: any, formatStr = 'MMM d') => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    return format(d, formatStr);
  } catch {
    return '-';
  }
};

const formatCurrency = (amount: any, currency: string) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const symbol = CURRENCY_SYMBOLS[currency] || currency || 'MAD';
  return `${symbol} ${num.toFixed(2)}`;
};

export function PendingPaymentsWidget() {
  const navigate = useNavigate();
  const { data: payments, isLoading } = usePendingPayments();
  const quickAction = useQuickPaymentAction();
  
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const handleAction = async () => {
    if (!selectedPayment || !actionType) return;
    
    await quickAction.mutateAsync({
      id: selectedPayment,
      status: actionType === 'approve' ? 'approved' : 'rejected',
      adminNotes: adminNotes || undefined,
    });
    
    setSelectedPayment(null);
    setActionType(null);
    setAdminNotes('');
  };

  const pendingCount = payments?.length || 0;
  const displayPayments = payments?.slice(0, 3) || [];

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Pending Payments
          </CardTitle>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {pendingCount} pending
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))
          ) : pendingCount === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">All caught up!</p>
              <p className="text-xs">No pending payments</p>
            </div>
          ) : (
            <>
              {displayPayments.map((payment) => (
                <div 
                  key={payment.id} 
                  className="p-3 rounded-lg border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{payment.student_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{payment.program_name || 'No program'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {safeFormatDate(payment.created_at, 'MMM d')}
                        </Badge>
                        {payment.receipt_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1"
                            onClick={() => setReceiptUrl(payment.receipt_url)}
                          >
                            <ImageIcon className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary text-sm">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <div className="flex gap-1 mt-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-100"
                          onClick={() => {
                            setSelectedPayment(payment.id);
                            setActionType('reject');
                          }}
                          disabled={quickAction.isPending}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-green-500 hover:text-green-600 hover:bg-green-100"
                          onClick={() => {
                            setSelectedPayment(payment.id);
                            setActionType('approve');
                          }}
                          disabled={quickAction.isPending}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {pendingCount > 3 && (
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => navigate('/admin/payments')}
                >
                  View all {pendingCount} pending
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </>
          )}
          
          {pendingCount > 0 && pendingCount <= 3 && (
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => navigate('/admin/payments')}
            >
              Go to Payments
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Confirm Action Dialog */}
      <Dialog open={!!selectedPayment && !!actionType} onOpenChange={() => {
        setSelectedPayment(null);
        setActionType(null);
        setAdminNotes('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Payment' : 'Reject Payment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={actionType === 'reject' ? 'Reason for rejection...' : 'Add any notes...'}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedPayment(null);
                setActionType(null);
                setAdminNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={quickAction.isPending}
            >
              {quickAction.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={!!receiptUrl} onOpenChange={() => setReceiptUrl(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {receiptUrl && (
            <div className="flex flex-col items-center gap-4">
              <img 
                src={receiptUrl} 
                alt="Payment receipt" 
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
              <a 
                href={receiptUrl} 
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
    </>
  );
}
