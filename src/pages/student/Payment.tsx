import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  useStudentEnrollmentStatus,
  useStudentTestResult,
  useProgramPricing,
  useSubmitManualPayment,
  useStudentPayments,
} from '@/hooks/usePaymentFlow';
import { uploadService } from '@/services/apiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  Clock, 
  XCircle,
  Receipt,
  Upload,
  AlertCircle,
  ImageIcon,
  X
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

const safeFormatDate = (dateStr: any, formatStr: string = 'PPP') => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return format(d, formatStr);
  } catch {
    return '-';
  }
};

export default function Payment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: enrollmentStatus, isLoading: loadingStatus } = useStudentEnrollmentStatus();
  const { data: testResult, isLoading: loadingTestResult } = useStudentTestResult();
  const { data: pricing, isLoading: loadingPricing } = useProgramPricing();
  const { data: payments, isLoading: loadingPayments } = useStudentPayments();
  const submitPayment = useSubmitManualPayment();
  
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Redirect based on enrollment status
  useEffect(() => {
    if (loadingStatus || !enrollmentStatus) return;
    
    // If program not selected, go to program selection
    if (!enrollmentStatus.hasCompletedTest) {
      navigate('/student/program-selection');
      return;
    }
    
    // If already has approved payment, go to dashboard
    if (enrollmentStatus.hasApprovedPayment) {
      navigate('/student');
      return;
    }
  }, [enrollmentStatus, loadingStatus, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (JPG, PNG, etc.)');
        return;
      }
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File size must be less than 20MB');
        return;
      }
      setReceiptFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile) return null;
    
    setIsUploading(true);
    try {
      const res = await uploadService.uploadFile(receiptFile);
      if (!res?.url) {
        throw new Error('No URL returned from server');
      }
      return res.url;
    } catch (error: any) {
      console.error('Failed to upload receipt:', error);
      const msg = error.response?.data?.error || error.message || 'Failed to upload receipt. Please try again.';
      toast.error(msg);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  if (loadingStatus || loadingTestResult || loadingPricing || loadingPayments) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const assignedProgramId = testResult?.assigned_program_id;
  const programPricing = pricing?.find(p => p.program_id === assignedProgramId) || pricing?.[0];
  const program = programPricing?.programs;
  const price = programPricing?.price || 0;
  const currency = programPricing?.currency || 'USD';

  // Check if there's a pending payment
  const pendingPayment = payments?.find(p => p.status === 'pending');
  const rejectedPayments = payments?.filter(p => p.status === 'rejected') || [];

  const handleSubmitManualPayment = async () => {
    const targetProgramId = assignedProgramId || programPricing?.program_id;
    if (!targetProgramId) {
      toast.error('Please choose a program before submitting payment.');
      return;
    }
    if (!receiptFile) {
      toast.error('Please upload a proof of payment (receipt image)');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Upload receipt first
      const receiptUrl = await uploadReceipt();
      if (!receiptUrl && receiptFile) {
        // Upload failed, don't proceed
        setIsSubmitting(false);
        return;
      }
      
      await submitPayment.mutateAsync({
        programId: targetProgramId,
        amount: price,
        referenceNumber,
        notes,
        receiptUrl: receiptUrl || undefined,
      });
      setReferenceNumber('');
      setNotes('');
      removeReceipt();
    } catch (error) {
      console.error('Failed to submit payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Program Assignment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Selected Program
            </CardTitle>
            <CardDescription>
              You have selected the following program. Complete your payment to start learning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-accent/50 rounded-lg">
              <h3 className="text-xl font-semibold">{program?.name || 'Program'}</h3>
              {program?.description && (
                <p className="text-muted-foreground mt-2">{program.description}</p>
              )}
              {program?.duration && (
                <p className="text-sm text-muted-foreground mt-1">Duration: {program.duration}</p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between p-4 border rounded-lg">
              <span className="text-lg font-medium">Total Amount</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(price, currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Payment Notice */}
        {pendingPayment && (
          <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-5 w-5" />
                Payment Pending Review
              </CardTitle>
              <CardDescription>
                Your payment submission is currently being reviewed by the administration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Reference:</strong> {pendingPayment.reference_number || 'N/A'}</p>
                <p><strong>Submitted:</strong> {safeFormatDate(pendingPayment.created_at, 'PPP')}</p>
                <p><strong>Amount:</strong> {formatCurrency(pendingPayment.amount, currency)}</p>
                {pendingPayment.receipt_url && (
                  <div className="mt-3">
                    <p className="font-medium mb-2">Receipt Uploaded:</p>
                    <img 
                      src={pendingPayment.receipt_url} 
                      alt="Payment receipt" 
                      className="max-w-[200px] rounded border"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejected Payment Notice */}
        {rejectedPayments.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Previous Payment Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rejectedPayments.map(payment => (
                <div key={payment.id} className="p-3 bg-background rounded border mb-2">
                  <p className="text-sm"><strong>Reference:</strong> {payment.reference_number || 'N/A'}</p>
                  <p className="text-sm"><strong>Reason:</strong> {payment.admin_notes || 'No reason provided'}</p>
                  <p className="text-sm text-muted-foreground">
                    Rejected on {safeFormatDate(payment.reviewed_at || payment.updated_at, 'PPP')}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Payment Methods */}
        {!pendingPayment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Choose your preferred payment method to complete your enrollment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="manual">Manual Payment</TabsTrigger>
                  <TabsTrigger value="stripe" disabled>Stripe (Coming Soon)</TabsTrigger>
                  <TabsTrigger value="paypal" disabled>PayPal (Coming Soon)</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div className="p-4 bg-accent/30 rounded-lg space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Bank Transfer Instructions
                    </h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Bank Name:</strong> Simply University Bank</p>
                      <p><strong>Account Number:</strong> 1234-5678-9012</p>
                      <p><strong>IBAN:</strong> XX00 1234 5678 9012 3456 78</p>
                      <p><strong>Reference:</strong> Use your email or student ID</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Receipt Upload Section */}
                    <div className="space-y-2">
                      <Label htmlFor="receipt" className="flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        Proof of Payment (Receipt Image) *
                      </Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        {receiptPreview ? (
                          <div className="relative inline-block">
                            <img 
                              src={receiptPreview} 
                              alt="Receipt preview" 
                              className="max-h-48 rounded-lg mx-auto"
                            />
                            <button
                              type="button"
                              onClick={removeReceipt}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg hover:bg-destructive/90"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer py-8"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload your payment receipt
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              JPG, PNG up to 5MB
                            </p>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          id="receipt"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reference">Payment Reference / Receipt Number</Label>
                      <Input
                        id="reference"
                        placeholder="Enter your payment reference or receipt number (optional)"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional information about your payment..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                    
                    <Button
                      onClick={handleSubmitManualPayment}
                      disabled={!receiptFile || isSubmitting || isUploading}
                      className="w-full"
                    >
                      {isSubmitting || isUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {isUploading ? 'Uploading Receipt...' : 'Submit Payment for Review'}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="stripe" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Stripe payments will be available soon.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="paypal" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>PayPal payments will be available soon.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        {payments && payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{formatCurrency(payment.amount, currency)}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.reference_number || 'No reference'} • {safeFormatDate(payment.created_at, 'PPP')}
                      </p>
                      {payment.receipt_url && (
                        <a 
                          href={payment.receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View Receipt
                        </a>
                      )}
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
