import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { 
  useAllPlacementTestQuestions, 
  useCreatePlacementQuestion, 
  useUpdatePlacementQuestion, 
  useDeletePlacementQuestion,
  useAllTestResults,
  useSeedSampleQuestions,
} from '@/hooks/usePaymentFlow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormModal } from '@/components/common/FormModal';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ClipboardCheck, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Search, 
  HelpCircle, 
  Users, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Check, 
  Filter, 
  Eye,
  GraduationCap,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface QuestionForm {
  question_text: string;
  options: string[];
  correct_option_index: number;
  points: number;
  order_index: number;
  is_active: boolean;
}

export default function PlacementTestManagement() {
  const { t, i18n } = useTranslation();
  const { data: questions = [], isLoading: loadingQuestions } = useAllPlacementTestQuestions();
  const { data: results = [], isLoading: loadingResults } = useAllTestResults();
  
  const createQuestion = useCreatePlacementQuestion();
  const updateQuestion = useUpdatePlacementQuestion();
  const deleteQuestion = useDeletePlacementQuestion();
  const seedQuestions = useSeedSampleQuestions();
  
  const [activeTab, setActiveTab] = useState('questions');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  
  // Question Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  
  const [formData, setFormData] = useState<QuestionForm>({
    question_text: '',
    options: ['', '', '', ''],
    correct_option_index: 0,
    points: 1,
    order_index: 0,
    is_active: true,
  });

  // Simulator / Preview State
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState<Record<number, number>>({});
  const [previewCompleted, setPreviewCompleted] = useState(false);

  // Computed metrics
  const activeQuestions = useMemo(() => questions.filter(q => q.is_active), [questions]);
  const totalPoints = useMemo(() => questions.reduce((sum, q) => sum + (q.points || 1), 0), [questions]);
  const activeTotalPoints = useMemo(() => activeQuestions.reduce((sum, q) => sum + (q.points || 1), 0), [activeQuestions]);
  
  const averageStudentScore = useMemo(() => {
    if (!results || results.length === 0) return 0;
    const totalPercentage = results.reduce((acc: number, r: any) => {
      const pct = r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0;
      return acc + pct;
    }, 0);
    return Math.round(totalPercentage / results.length);
  }, [results]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(q.options) && q.options.some((opt: string) => opt.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'active' 
          ? q.is_active 
          : !q.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [questions, searchTerm, statusFilter]);

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter((r: any) => {
      const query = studentSearchTerm.toLowerCase();
      const name = (r.student_name || '').toLowerCase();
      const email = (r.student_email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [results, studentSearchTerm]);

  // Handlers for Question Modal
  const openAddModal = () => {
    setFormData({
      question_text: '',
      options: ['', '', '', ''],
      correct_option_index: 0,
      points: 1,
      order_index: (questions?.length || 0) + 1,
      is_active: true,
    });
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  const openEditModal = (question: any) => {
    const rawOptions = Array.isArray(question.options) ? question.options : [];
    const options = rawOptions.length >= 2 ? [...rawOptions] : ['', '', '', ''];
    setFormData({
      question_text: question.question_text || '',
      options,
      correct_option_index: question.correct_option_index ?? 0,
      points: question.points || 1,
      order_index: question.order_index ?? 0,
      is_active: question.is_active ?? true,
    });
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  const handleAddOption = () => {
    if (formData.options.length >= 6) {
      toast.error('Maximum 6 options allowed');
      return;
    }
    setFormData(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 2) {
      toast.error('At least 2 options are required');
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    let newCorrect = formData.correct_option_index;
    if (newCorrect === index) {
      newCorrect = 0;
    } else if (newCorrect > index) {
      newCorrect -= 1;
    }
    setFormData(prev => ({
      ...prev,
      options: newOptions,
      correct_option_index: newCorrect,
    }));
  };

  const updateOptionText = (index: number, val: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = val;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmitQuestion = async () => {
    if (!formData.question_text.trim()) {
      toast.error(t('placementTest.questionText', 'Question text is required'));
      return;
    }
    
    const validOptions = formData.options.map(o => o.trim());
    if (validOptions.some(o => !o)) {
      toast.error('All options must have text');
      return;
    }

    if (validOptions.length < 2) {
      toast.error('At least 2 options are required');
      return;
    }

    const payload = {
      question_text: formData.question_text.trim(),
      options: validOptions,
      correct_option_index: formData.correct_option_index,
      points: Number(formData.points) || 1,
      order_index: Number(formData.order_index) || 0,
      is_active: formData.is_active,
    };

    try {
      if (editingQuestion) {
        await updateQuestion.mutateAsync({ id: editingQuestion.id, ...payload });
      } else {
        await createQuestion.mutateAsync(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      // error handled by hook
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteQuestion.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (question: any) => {
    try {
      await updateQuestion.mutateAsync({
        id: question.id,
        is_active: !question.is_active,
      });
    } catch (e) {
      // error handled by hook
    }
  };

  const handleSeedSamples = async () => {
    setShowSeedDialog(false);
    await seedQuestions.mutateAsync();
  };

  // Preview Simulator handlers
  const handlePreviewAnswer = (qIndex: number, optIndex: number) => {
    setPreviewAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const resetPreview = () => {
    setPreviewIndex(0);
    setPreviewAnswers({});
    setPreviewCompleted(false);
  };

  const calculatePreviewScore = () => {
    let score = 0;
    activeQuestions.forEach((q, idx) => {
      if (previewAnswers[idx] === q.correct_option_index) {
        score += (q.points || 1);
      }
    });
    return score;
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t('placementTest.placementTest', 'Placement Test')}
        description={t('placementTest.placementTestDesc', 'Manage test questions and criteria for student evaluation and program orientation.')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSeedDialog(true)}
              disabled={seedQuestions.isPending}
              className="gap-2 border-primary/30 hover:bg-primary/5"
            >
              {seedQuestions.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
              {t('placementTest.seedSamples', 'Seed 10 Sample Questions')}
            </Button>
            <Button onClick={openAddModal} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('placementTest.addQuestion', 'Add Question')}
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('placementTest.totalQuestions', 'Total Questions')}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">{questions.length}</span>
                  <span className="text-xs text-muted-foreground">({totalPoints} {t('placementTest.pointsPlural', 'pts')})</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <HelpCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('placementTest.activeQuestions', 'Active Questions')}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {activeQuestions.length}
                  </span>
                  <span className="text-xs text-muted-foreground">({activeTotalPoints} {t('placementTest.pointsPlural', 'pts')})</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('placementTest.submissionsCount', 'Completed Tests')}
                </p>
                <span className="text-2xl font-bold text-foreground">{results.length}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('placementTest.score', 'Average Score')}
                </p>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {averageStudentScore}%
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Award className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Questions / Results / Simulator */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="questions" className="gap-2 data-[state=active]:bg-background">
              <ClipboardCheck className="h-4 w-4" />
              {t('placementTest.testQuestions', 'Test Questions')}
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {questions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2 data-[state=active]:bg-background">
              <Users className="h-4 w-4" />
              {t('placementTest.studentResults', 'Student Submissions')}
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {results.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2 data-[state=active]:bg-background">
              <Eye className="h-4 w-4" />
              {t('placementTest.testPreview', 'Student Test Preview')}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: QUESTIONS MANAGEMENT */}
          <TabsContent value="questions" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                <Input
                  placeholder={t('placementTest.searchQuestions', 'Search questions by text...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 rtl:pl-3 rtl:pr-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex rounded-lg border bg-background p-1 text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      statusFilter === 'all' ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('placementTest.allStatuses', 'All')} ({questions.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      statusFilter === 'active' ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('placementTest.active', 'Active')} ({activeQuestions.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('inactive')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      statusFilter === 'inactive' ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('placementTest.inactive', 'Inactive')} ({questions.length - activeQuestions.length})
                  </button>
                </div>
              </div>
            </div>

            {loadingQuestions ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : questions.length === 0 ? (
              <Card className="text-center py-16 border-dashed">
                <CardContent className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center text-primary">
                    <ClipboardCheck className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">{t('placementTest.noQuestions', 'No Questions Yet')}</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {t('placementTest.noQuestionsDesc', 'Add your first question or seed pre-made sample questions to begin.')}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <Button onClick={openAddModal} className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t('placementTest.addQuestion', 'Add Question')}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowSeedDialog(true)}
                      disabled={seedQuestions.isPending}
                      className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
                    >
                      <Sparkles className="h-4 w-4" />
                      {t('placementTest.seedSamples', 'Seed 10 Sample Questions')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : filteredQuestions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">No questions found matching your filter criteria.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => {
                  const opts = Array.isArray(question.options) ? question.options : [];
                  return (
                    <Card 
                      key={question.id} 
                      className={`transition-all duration-200 hover:shadow-md ${
                        !question.is_active ? 'opacity-65 border-dashed bg-muted/20' : 'border-border/80'
                      }`}
                    >
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                              {question.order_index ?? index + 1}
                            </span>
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-base sm:text-lg text-foreground">
                                  {question.question_text}
                                </h3>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant="secondary" className="font-medium">
                                  {question.points || 1} {question.points === 1 ? t('placementTest.pointsShort', 'pt') : t('placementTest.pointsPlural', 'pts')}
                                </Badge>
                                {question.is_active ? (
                                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20">
                                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                                    {t('placementTest.active', 'Active')}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground border-border bg-muted/40">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    {t('placementTest.inactive', 'Inactive')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-start">
                            <div className="flex items-center gap-1.5 mr-2 rtl:mr-0 rtl:ml-2">
                              <Switch
                                checked={question.is_active}
                                onCheckedChange={() => handleToggleActive(question)}
                                title={t('placementTest.toggleStatus', 'Toggle Active')}
                              />
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditModal(question)} 
                              className="h-8 gap-1.5"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{t('placementTest.editQuestion', 'Edit')}</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setDeleteId(question.id)} 
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/40">
                          {opts.map((option: string, i: number) => {
                            const isCorrect = i === question.correct_option_index;
                            return (
                              <div
                                key={i}
                                className={`flex items-center gap-2 p-2.5 rounded-lg text-sm transition-colors ${
                                  isCorrect 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-medium' 
                                    : 'bg-muted/40 border border-border/40 text-foreground/80'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                                  isCorrect 
                                    ? 'bg-emerald-600 text-white font-bold' 
                                    : 'bg-muted text-muted-foreground font-medium'
                                }`}>
                                  {isCorrect ? '✓' : String.fromCharCode(65 + i)}
                                </span>
                                <span className="flex-1 truncate">{option}</span>
                                {isCorrect && (
                                  <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">
                                    {t('placementTest.correctAnswerLabel', 'Correct')}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: STUDENT RESULTS */}
          <TabsContent value="results" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                <Input
                  placeholder={t('placementTest.searchStudents', 'Search students by name or email...')}
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="pl-9 rtl:pl-3 rtl:pr-9"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {t('placementTest.submissionsCount', 'Completed Tests')}: <span className="font-semibold text-foreground">{results.length}</span>
              </div>
            </div>

            {loadingResults ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : results.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent className="space-y-3">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold">{t('placementTest.noResults', 'No Test Results Yet')}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t('placementTest.noResultsDesc', 'Student scores and evaluations will appear here once they complete the placement test.')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden border-border/80 shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>{t('placementTest.studentName', 'Student')}</TableHead>
                        <TableHead>{t('placementTest.assignedProgram', 'Assigned Program')}</TableHead>
                        <TableHead className="text-center">{t('placementTest.score', 'Score')}</TableHead>
                        <TableHead className="text-center">{t('placementTest.percentage', 'Percentage')}</TableHead>
                        <TableHead>{t('placementTest.completionDate', 'Date')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.map((result: any) => {
                        const pct = result.total_questions > 0 
                          ? Math.round((result.score / result.total_questions) * 100) 
                          : 0;

                        const programName = i18n.language === 'ar' 
                          ? (result.program_name_ar || result.program_name_en) 
                          : i18n.language === 'fr' 
                            ? (result.program_name_fr || result.program_name_en) 
                            : (result.program_name_en || result.program_name_ar);

                        return (
                          <TableRow key={result.id} className="hover:bg-muted/30">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={result.avatar_url} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                    {(result.student_name || 'U').substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-sm text-foreground">{result.student_name}</p>
                                  <p className="text-xs text-muted-foreground">{result.student_email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {programName ? (
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                                  <span className="font-medium text-sm">{programName}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Not Assigned</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-bold text-sm">
                              {result.score} / {result.total_questions}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant="outline"
                                className={`font-semibold ${
                                  pct >= 80 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800' 
                                    : pct >= 60 
                                      ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800' 
                                      : pct >= 40 
                                        ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800' 
                                        : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
                                }`}
                              >
                                {pct}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {result.created_at ? new Date(result.created_at).toLocaleDateString(i18n.language, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* TAB 3: TEST PREVIEW / SIMULATOR */}
          <TabsContent value="preview" className="space-y-4">
            {activeQuestions.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent className="space-y-3">
                  <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-2" />
                  <h3 className="text-lg font-bold">{t('placementTest.noQuestions', 'No Questions Yet')}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    You need to have at least one active question to preview the student test experience.
                  </p>
                  <Button onClick={openAddModal} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    {t('placementTest.addQuestion', 'Add Question')}
                  </Button>
                </CardContent>
              </Card>
            ) : previewCompleted ? (
              <Card className="max-w-2xl mx-auto py-8 text-center shadow-lg border-primary/20">
                <CardHeader className="space-y-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
                    <Award className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    {t('placementTest.previewScore', 'Preview Test Score')}
                  </CardTitle>
                  <CardDescription>
                    Here is the simulated result based on the responses chosen:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 rounded-2xl bg-muted/40 border max-w-md mx-auto">
                    <div className="text-4xl font-extrabold text-primary mb-1">
                      {calculatePreviewScore()} / {activeTotalPoints}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {Math.round((calculatePreviewScore() / activeTotalPoints) * 100)}% {t('placementTest.percentage', 'Percentage')}
                    </div>
                  </div>

                  <div className="space-y-3 text-left rtl:text-right max-w-md mx-auto">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Question Breakdown
                    </h4>
                    <div className="space-y-2">
                      {activeQuestions.map((q, idx) => {
                        const isCorrect = previewAnswers[idx] === q.correct_option_index;
                        return (
                          <div 
                            key={idx}
                            className={`flex items-center justify-between p-3 rounded-lg text-sm border ${
                              isCorrect 
                                ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' 
                                : 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800'
                            }`}
                          >
                            <span className="font-medium truncate max-w-[280px]">
                              {idx + 1}. {q.question_text}
                            </span>
                            <span className={`font-bold shrink-0 ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isCorrect ? `+${q.points || 1}` : '0'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Button onClick={resetPreview} className="gap-2 mt-4">
                    <RotateCcw className="h-4 w-4" />
                    {t('placementTest.retakePreview', 'Retake Preview Test')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="max-w-2xl mx-auto shadow-md border-border/80">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="gap-1.5 text-primary border-primary/30">
                      <Eye className="h-3.5 w-3.5" />
                      Simulator Mode
                    </Badge>
                    <span className="text-sm font-medium px-3 py-1 bg-secondary rounded-full">
                      {t('placementTest.questionOf', { current: previewIndex + 1, total: activeQuestions.length })}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Progress 
                      value={((previewIndex + 1) / activeQuestions.length) * 100} 
                      className="h-2" 
                    />
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>{Object.keys(previewAnswers).length} of {activeQuestions.length} answered</span>
                      <span>{Math.round(((previewIndex + 1) / activeQuestions.length) * 100)}%</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-2">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                    <h3 className="text-lg font-semibold leading-relaxed text-foreground">
                      {activeQuestions[previewIndex]?.question_text}
                    </h3>
                  </div>

                  <RadioGroup
                    value={previewAnswers[previewIndex]?.toString() ?? ''}
                    onValueChange={(val) => handlePreviewAnswer(previewIndex, parseInt(val))}
                    className="space-y-3"
                  >
                    {(activeQuestions[previewIndex]?.options as string[])?.map((option, optIdx) => {
                      const isSelected = previewAnswers[previewIndex] === optIdx;
                      return (
                        <label 
                          key={optIdx} 
                          htmlFor={`sim-opt-${optIdx}`}
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-primary bg-primary/5 shadow-sm' 
                              : 'border-border/80 hover:bg-muted/50'
                          }`}
                        >
                          <RadioGroupItem value={optIdx.toString()} id={`sim-opt-${optIdx}`} />
                          <span className="flex-1 font-medium text-sm sm:text-base leading-relaxed">
                            {option}
                          </span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </CardContent>

                <div className="flex items-center justify-between border-t p-4 sm:p-6 bg-muted/10">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                    disabled={previewIndex === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                    {t('common.previous', 'Previous')}
                  </Button>

                  {previewIndex === activeQuestions.length - 1 ? (
                    <Button
                      onClick={() => setPreviewCompleted(true)}
                      className="gap-2 font-medium"
                    >
                      <Check className="h-4 w-4" />
                      Finish & Check Score
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setPreviewIndex(prev => Math.min(activeQuestions.length - 1, prev + 1))}
                      className="gap-2 font-medium"
                    >
                      {t('common.next', 'Next')}
                      <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add / Edit Question Modal */}
      <FormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingQuestion ? t('placementTest.editQuestion', 'Edit Question') : t('placementTest.addQuestion', 'Add Question')}
        onSubmit={handleSubmitQuestion}
        submitLabel={editingQuestion ? t('common.save', 'Save') : t('common.add', 'Add')}
        isLoading={createQuestion.isPending || updateQuestion.isPending}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t('placementTest.questionText', 'Question Text')} *</Label>
            <Input
              value={formData.question_text}
              onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
              placeholder="e.g. What does HTTP stand for?"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">{t('placementTest.options', 'Options')}</Label>
              {formData.options.length < 6 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleAddOption}
                  className="h-7 text-xs text-primary gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('placementTest.addOption', 'Add Option')}
                </Button>
              )}
            </div>
            
            <div className="space-y-2.5">
              {formData.options.map((option, index) => {
                const isChecked = formData.correct_option_index === index;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <label 
                      title={t('placementTest.correctAnswer', 'Set as correct answer')}
                      className={`flex items-center justify-center w-7 h-7 rounded-full border cursor-pointer transition-colors ${
                        isChecked 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'border-muted-foreground/40 hover:border-emerald-500 text-muted-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="correct_option"
                        checked={isChecked}
                        onChange={() => setFormData(prev => ({ ...prev, correct_option_index: index }))}
                        className="sr-only"
                      />
                      {isChecked ? '✓' : String.fromCharCode(65 + index)}
                    </label>

                    <Input
                      value={option}
                      onChange={(e) => updateOptionText(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />

                    {formData.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Click the letter circle next to an option to mark it as the correct answer.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('placementTest.points', 'Points')}</Label>
              <Input
                type="number"
                min={1}
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('placementTest.order', 'Order')}</Label>
              <Input
                type="number"
                min={0}
                value={formData.order_index}
                onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
            <div className="space-y-0.5">
              <Label className="font-semibold text-sm">{t('placementTest.active', 'Active')}</Label>
              <p className="text-xs text-muted-foreground">Students can see and answer this question</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('placementTest.deleteQuestion', 'Delete Question')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('placementTest.deleteQuestionConfirm', 'Are you sure you want to delete this question? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Seed Confirmation Alert */}
      <AlertDialog open={showSeedDialog} onOpenChange={setShowSeedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('placementTest.seedSamples', 'Seed 10 Sample Questions')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('placementTest.seedSamplesConfirm', 'This will add 10 pre-configured tech and programming placement questions. Do you want to proceed?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSeedSamples} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {t('common.confirm', 'Proceed')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
