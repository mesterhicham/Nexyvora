import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2, GripVertical, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QuizQuestion {
  id?: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  order_index: number;
}

interface QuizEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizTitle: string;
  passingScore: number;
  questions: QuizQuestion[];
  onSave: (title: string, passingScore: number, questions: Omit<QuizQuestion, 'id'>[]) => void;
  isLoading?: boolean;
}

export function QuizEditor({
  open,
  onOpenChange,
  quizTitle: initialTitle,
  passingScore: initialPassingScore,
  questions: initialQuestions,
  onSave,
  isLoading,
}: QuizEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [passingScore, setPassingScore] = useState(initialPassingScore);
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialQuestions.length > 0 ? initialQuestions : [
      { question_text: '', options: ['', '', '', ''], correct_option_index: 0, order_index: 0 }
    ]
  );

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        options: ['', '', '', ''],
        correct_option_index: 0,
        order_index: questions.length,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error('Quiz must have at least one question');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSave = () => {
    // Validate
    if (!title.trim()) {
      toast.error('Quiz title is required');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      if (q.options.some(o => !o.trim())) {
        toast.error(`All options for question ${i + 1} are required`);
        return;
      }
    }

    onSave(
      title,
      passingScore,
      questions.map((q, i) => ({
        question_text: q.question_text,
        options: q.options,
        correct_option_index: q.correct_option_index,
        order_index: i,
      }))
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quiz Editor</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quiz Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quiz Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title"
              />
            </div>
            <div>
              <Label>Passing Score (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Questions</Label>
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.map((question, qIndex) => (
              <Card key={qIndex} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <span className="font-medium">Question {qIndex + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-destructive"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Question Text</Label>
                    <Textarea
                      value={question.question_text}
                      onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                      placeholder="Enter your question"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Options (select the correct answer)</Label>
                    <RadioGroup
                      value={question.correct_option_index.toString()}
                      onValueChange={(value) => updateQuestion(qIndex, 'correct_option_index', parseInt(value))}
                      className="space-y-2"
                    >
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-3">
                          <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                          <Input
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground mt-2">
                      Selected option will be marked as the correct answer
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Quiz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
