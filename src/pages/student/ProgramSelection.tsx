import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicService, studentService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentEnrollmentStatus, useProgramPricing } from '@/hooks/usePaymentFlow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Loader2, 
  CheckCircle, 
  Clock,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';

interface Specialty {
  id: string;
  name: string;
  description: string | null;
  program_id: string | null;
}

interface Program {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  image_url?: string | null;
}

// Hook to fetch specialties
function useSpecialties() {
  return useQuery({
    queryKey: ['specialties-with-programs'],
    queryFn: async () => {
      const data = await academicService.getSpecialties();
      return (data || []).map((s: any) => ({
        ...s,
        programs: s.program_id ? { id: s.program_id, name: s.program_name } : null
      }));
    },
  });
}

// Hook to fetch all programs
function useAllPrograms() {
  return useQuery({
    queryKey: ['all-programs'],
    queryFn: () => academicService.getPrograms(),
  });
}

// Hook to submit program selection
function useSubmitProgramSelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ programId, specialtyId }: { programId: string; specialtyId?: string }) =>
      studentService.selectProgram({ programId, specialtyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-test-result'] });
      queryClient.invalidateQueries({ queryKey: ['student-enrollment-status'] });
      toast.success('Program selected successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to select program: ${error.message}`);
    },
  });
}

export default function ProgramSelection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { data: enrollmentStatus, isLoading: enrollmentLoading } = useStudentEnrollmentStatus();
  const { data: specialties, isLoading: loadingSpecialties } = useSpecialties();
  const { data: programs, isLoading: loadingPrograms } = useAllPrograms();
  const { data: pricing, isLoading: loadingPricing } = useProgramPricing();
  const submitSelection = useSubmitProgramSelection();
  
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect based on enrollment status
  useEffect(() => {
    if (enrollmentLoading || !enrollmentStatus) return;
    
    // If already selected program (test completed), go to payment or dashboard
    if (enrollmentStatus.hasCompletedTest) {
      if (!enrollmentStatus.hasApprovedPayment) {
        navigate('/student/payment');
      } else {
        navigate('/student');
      }
    }
  }, [enrollmentStatus, enrollmentLoading, navigate]);

  // Redirect if not a student
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (role && role !== 'student') {
      navigate(role === 'admin' ? '/admin' : '/teacher');
    }
  }, [user, role, navigate]);

  if (enrollmentLoading || loadingSpecialties || loadingPrograms || loadingPricing) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Get specialties for selected program
  const filteredSpecialties = specialties?.filter(s => s.program_id === selectedProgram) || [];

  // Get pricing for selected program
  const programPricing = pricing?.find(p => p.program_id === selectedProgram);
  const price = Number(programPricing?.price) || 0;
  const currency = programPricing?.currency || 'USD';

  const handleSubmit = async () => {
    if (!selectedProgram) {
      toast.error('Please select a program');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await submitSelection.mutateAsync({
        programId: selectedProgram,
        specialtyId: selectedSpecialty || undefined,
      });
      
      // Navigate to payment
      navigate('/student/payment');
    } catch (error) {
      console.error('Failed to submit selection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Choose Your Program</h1>
          <p className="text-muted-foreground mt-2">
            Select your preferred program and specialty to begin your educational journey
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">1</div>
            <span className="font-medium">Select Program</span>
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold">2</div>
            <span className="text-muted-foreground">Payment</span>
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold">3</div>
            <span className="text-muted-foreground">Start Learning</span>
          </div>
        </div>

        {/* Programs Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Select a Program
            </CardTitle>
            <CardDescription>
              Choose the program that best fits your career goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(!programs || programs.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No programs available. Please contact administration.</p>
              </div>
            ) : (
              <RadioGroup
                value={selectedProgram}
                onValueChange={(value) => {
                  setSelectedProgram(value);
                  setSelectedSpecialty(''); // Reset specialty when program changes
                }}
                className="grid gap-4"
              >
                {programs.map((program) => {
                  const programPrice = pricing?.find(p => p.program_id === program.id);
                  return (
                    <div 
                      key={program.id}
                      className={`relative flex items-start space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 ${
                        selectedProgram === program.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <RadioGroupItem value={program.id} id={program.id} className="mt-1" />
                      {program.image_url ? (
                        <img 
                          src={program.image_url} 
                          alt={program.name} 
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0 border border-border/60 shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-primary">
                          <BookOpen className="h-7 w-7" />
                        </div>
                      )}
                      <Label htmlFor={program.id} className="flex-1 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{program.name}</h3>
                            {program.description && (
                              <p className="text-muted-foreground mt-1 text-sm">{program.description}</p>
                            )}
                            {program.duration && (
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {program.duration}
                                </Badge>
                              </div>
                            )}
                          </div>
                          {programPrice && (
                            <div className="text-right">
                              <span className="text-2xl font-bold text-primary">
                                {programPrice.currency} {Number(programPrice.price).toFixed(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </Label>
                      {selectedProgram === program.id && (
                        <CheckCircle className="h-5 w-5 text-primary absolute top-4 right-4" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* Specialties Selection (if available for selected program) */}
        {selectedProgram && filteredSpecialties.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Select a Specialty (Optional)
              </CardTitle>
              <CardDescription>
                Choose a specialization within your program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedSpecialty}
                onValueChange={setSelectedSpecialty}
                className="grid gap-3"
              >
                {filteredSpecialties.map((specialty) => (
                  <div 
                    key={specialty.id}
                    className={`flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 ${
                      selectedSpecialty === specialty.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <RadioGroupItem value={specialty.id} id={specialty.id} />
                    <Label htmlFor={specialty.id} className="flex-1 cursor-pointer">
                      <h4 className="font-medium">{specialty.name}</h4>
                      {specialty.description && (
                        <p className="text-sm text-muted-foreground mt-1">{specialty.description}</p>
                      )}
                    </Label>
                    {selectedSpecialty === specialty.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Summary & Continue */}
        {selectedProgram && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Selected Program:</span>
                  <span className="font-semibold">
                    {programs?.find(p => p.id === selectedProgram)?.name}
                  </span>
                </div>
                {selectedSpecialty && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Specialty:</span>
                    <span className="font-semibold">
                      {specialties?.find(s => s.id === selectedSpecialty)?.name}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-lg font-medium">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">
                    {currency} {price.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Continue to Payment
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}