import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  usePlacementTestQuestions, 
  useSubmitPlacementTest, 
  useStudentEnrollmentStatus 
} from '@/hooks/usePaymentFlow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ChevronLeft, ChevronRight, ClipboardCheck, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function PlacementTest() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: questions, isLoading: loadingQuestions } = usePlacementTestQuestions();
  const { data: enrollmentStatus, isLoading: enrollmentLoading } = useStudentEnrollmentStatus();
  const submitTest = useSubmitPlacementTest();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize answers array when questions load
  useEffect(() => {
    if (questions && questions.length > 0 && answers.length === 0) {
      setAnswers(new Array(questions.length).fill(null));
    }
  }, [questions]);

  // Redirect if already completed test
  useEffect(() => {
    if (enrollmentLoading || !enrollmentStatus) return;
    
    if (enrollmentStatus.hasCompletedTest) {
      // If test is done but payment not approved, go to payment
      if (!enrollmentStatus.hasApprovedPayment) {
        navigate('/student/payment');
      } else {
        // Fully enrolled, go to dashboard
        navigate('/student');
      }
    }
  }, [enrollmentStatus, enrollmentLoading, navigate]);

  if (enrollmentLoading || loadingQuestions) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <DashboardLayout role="student">
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-6 w-6 text-primary" />
                {t('placementTest.placementTest', 'Placement Test')}
              </CardTitle>
              <CardDescription>
                {t('placementTest.noQuestionsDesc', 'No test questions available at this time. Please contact administration.')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = answers.filter(a => a !== null).length;
  const allAnswered = answeredCount === questions.length;

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.some(a => a === null)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // SECURITY: Server-side validation - send only answers, score calculated on server
      await submitTest.mutateAsync({
        answers: answers as number[],
      });
      
      setIsCompleted(true);
      
      // Redirect to payment after a short delay
      setTimeout(() => {
        navigate('/student/payment');
      }, 2500);
    } catch (error) {
      console.error('Failed to submit test:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <DashboardLayout role="student">
        <div className="max-w-2xl mx-auto p-6">
          <Card className="text-center py-6 shadow-lg border-primary/20">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">
                {t('placementTest.testCompletedTitle', 'Test Completed!')}
              </CardTitle>
              <CardDescription className="text-base max-w-md mx-auto mt-2">
                {t('placementTest.testCompletedDesc', 'Your placement test has been submitted successfully. You will be redirected to the payment page.')}
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center pt-4">
              <Button size="lg" onClick={() => navigate('/student/payment')} className="gap-2">
                {t('placementTest.continueToPayment', 'Continue to Payment')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const options = Array.isArray(currentQuestion.options) 
    ? currentQuestion.options as string[]
    : [];

  return (
    <DashboardLayout role="student">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <Card className="shadow-md border-border/80">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ClipboardCheck className="h-6 w-6 text-primary" />
                {t('placementTest.placementTest', 'Placement Test')}
              </CardTitle>
              <span className="text-sm font-medium px-3 py-1 bg-secondary rounded-full text-secondary-foreground">
                {t('placementTest.questionOf', { current: currentIndex + 1, total: questions.length })}
              </span>
            </div>
            <div className="space-y-1">
              <Progress value={progress} className="h-2.5" />
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>{t('placementTest.answeredCount', { answered: answeredCount, total: questions.length })}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-2">
            <div className="min-h-[220px]">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/50 mb-6">
                <h3 className="text-lg font-semibold leading-relaxed text-foreground">
                  {currentQuestion.question_text}
                </h3>
              </div>
              
              <RadioGroup
                value={answers[currentIndex]?.toString() ?? ''}
                onValueChange={(value) => handleAnswer(parseInt(value))}
                className="space-y-3"
              >
                {options.map((option, index) => {
                  const isSelected = answers[currentIndex] === index;
                  return (
                    <label 
                      key={index} 
                      htmlFor={`option-${index}`}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm' 
                          : 'border-border/80 hover:bg-muted/50 hover:border-muted-foreground/30'
                      }`}
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <span className="flex-1 font-medium text-sm sm:text-base leading-relaxed">
                        {option}
                      </span>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>
          </CardContent>
          
          <CardFooter className="flex items-center justify-between border-t p-4 sm:p-6 bg-muted/10">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              {t('common.previous', 'Previous')}
            </Button>
            
            {currentIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered || isSubmitting}
                className="gap-2 font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('placementTest.submittingTest', 'Submitting...')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    {t('placementTest.submitTest', 'Submit Test')}
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} className="gap-2 font-medium">
                {t('common.next', 'Next')}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
