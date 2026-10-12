import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { academicService, paymentService } from '@/services/apiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlayCircle,
  FileText,
  Clock,
  Award,
  ShoppingCart,
  Lock,
  CheckCircle,
  ArrowRight,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

export default function FormationLanding() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [formation, setFormation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function fetchFormation() {
      if (!id) return;
      try {
        const data = await academicService.getProgram(id);
        setFormation(data);
      } catch (error) {
        toast.error('Formation not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    fetchFormation();
  }, [id, navigate]);

  const handleEnrollClick = () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    setShowPaymentModal(true);
  };

  const handleAuthRedirect = (mode: 'login' | 'signup') => {
    sessionStorage.setItem('pendingFormationEnrollment', id || '');
    navigate(`/auth?mode=${mode}&redirect=/formation/${id}`);
  };

  const handlePaymentSubmit = async () => {
    if (!formation || !paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      await paymentService.submitPayment({
        programId: formation.id,
        amount: formation.price,
        paymentMethod,
        referenceNumber,
        notes,
      });
      setShowPaymentModal(false);
      toast.success('Payment submitted! Awaiting admin approval.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Payment submission failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="w-full h-64 rounded-xl" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    );
  }

  if (!formation) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <Badge variant="secondary">Online Course</Badge>
              <h1 className="text-4xl md:text-5xl font-bold">{formation.title}</h1>
              <p className="text-lg text-muted-foreground">{formation.description}</p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="text-lg px-8" onClick={handleEnrollClick}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Enroll Now - {formation.price} MAD
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="w-full aspect-video bg-muted rounded-xl flex items-center justify-center">
                <PlayCircle className="h-20 w-20 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in to Enroll</DialogTitle>
            <DialogDescription>Create an account to purchase this course.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={() => handleAuthRedirect('signup')} size="lg">Create Account <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Button variant="outline" onClick={() => handleAuthRedirect('login')} size="lg">Sign In</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Enrollment</DialogTitle>
            <DialogDescription>Submit payment for "{formation.title}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg flex justify-between">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold text-primary">{formation.price} MAD</span>
            </div>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Reference Number" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
            <Textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button onClick={handlePaymentSubmit} disabled={!paymentMethod}>Submit Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
