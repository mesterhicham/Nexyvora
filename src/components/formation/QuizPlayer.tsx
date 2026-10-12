import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, HelpCircle, ArrowRight, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Questions interface WITHOUT correct answers (for security)
interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  order_index: number;
}

interface QuizPlayerProps {
  quizId: string;
  quizTitle: string;
  questions: QuizQuestion[];
  passingScore: number;
  onComplete: (score: number, passed: boolean, answers: number[]) => Promise<{ score: number; passed: boolean; correctAnswers: number; totalQuestions: number }>;
  previousAttempt?: { score: number; passed: boolean; answers: number[] } | null;
}

export function QuizPlayer({ 
  quizId, 
  quizTitle, 
  questions, 
  passingScore, 
  onComplete,
  previousAttempt 
}: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(previousAttempt?.passed || false);
  const [submitted, setSubmitted] = useState(previousAttempt?.passed || false);
  const [score, setScore] = useState(previousAttempt?.score || 0);
  const [passed, setPassed] = useState(previousAttempt?.passed || false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (optionIndex: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions answered
    if (answers.some(a => a === null)) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Server-side validation - score is calculated on the server
      const result = await onComplete(0, false, answers as number[]);
      
      setScore(result.score);
      setPassed(result.passed);
      setCorrectCount(result.correctAnswers);
      setSubmitted(true);
      setShowResults(true);
    } catch (error) {
      console.error('Quiz submission error:', error);
      toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers(new Array(questions.length).fill(null));
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setSubmitted(false);
    setScore(0);
    setPassed(false);
    setCorrectCount(0);
  };

  if (showResults) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {passed ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>
          <CardTitle className={passed ? 'text-green-600' : 'text-red-600'}>
            {passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-4xl font-bold">{score}%</div>
          <p className="text-muted-foreground">
            {passed 
              ? 'Congratulations! You can now proceed to the next content.'
              : `You need ${passingScore}% to pass. Please try again.`
            }
          </p>
          <div className="text-sm text-muted-foreground">
            Correct answers: {correctCount} / {questions.length}
          </div>
        </CardContent>
        {!passed && (
          <CardFooter className="justify-center">
            <Button onClick={handleRetry} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{quizTitle}</span>
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-6 h-6 text-primary shrink-0 mt-1" />
          <h3 className="text-lg font-medium">{currentQuestion.question_text}</h3>
        </div>

        <RadioGroup
          value={answers[currentQuestionIndex]?.toString()}
          onValueChange={(value) => handleAnswerSelect(parseInt(value))}
          className="space-y-3"
        >
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                answers[currentQuestionIndex] === index
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        <div className="flex gap-2">
          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNext} disabled={answers[currentQuestionIndex] === null}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={answers.some(a => a === null) || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Quiz'
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
