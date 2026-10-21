import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Award, Download, CheckCircle, Loader2, Lock } from 'lucide-react';
import { DiplomaTemplate } from '@/components/diploma/DiplomaTemplate';
import { generateDiplomaPdf } from '@/utils/generateDiplomaPdf';
import { useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function StudentDiploma() {
  const { t } = useTranslation();
  const diplomaRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Mock diploma data for the current student
  const diplomaData = {
    studentName: 'Ahmed Ben Ali',
    program: t('programs.specializedTechnician'),
    specialty: t('specialties.softwareDev'),
    serialNumber: 'DIP-2024-001',
    issueDate: 'December 15, 2024',
    cohort: '2022-2024',
  };

  const handleDownload = async () => {
    if (!diplomaRef.current) return;

    setIsGenerating(true);
    try {
      await generateDiplomaPdf(
        diplomaRef.current,
        `diploma-${diplomaData.serialNumber}.pdf`
      );
      toast({
        title: t('diploma.downloadSuccess'),
        description: diplomaData.serialNumber,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <PageHeader
        title={t('nav.myDiploma')}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/student' },
          { label: t('nav.myDiploma') },
        ]}
      />
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl p-8 shadow-lg border border-border text-center">
          <div className="inline-flex p-4 bg-success/10 rounded-full mb-6">
            <Award className="h-16 w-16 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t('student.congratulations')}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t('student.diplomaReady')}
          </p>

          {/* Certificate Requirement Banner */}
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5 text-left rtl:text-right">
            <Lock className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="font-bold text-xs">
                {t('diploma.requirementTitle', 'شرط منح الشهادة والاعتماد الرسمي:')}
              </p>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                {t('diploma.requirementDesc', 'لا يمكن للعضو أو المتدرب الحصول على الشهادة أو تنزيلها إلا بعد الإنتهاء الكامل من الدورة التكوينية واستيفاء متطلبات النجاح بنسبة 100%.')}
              </p>
            </div>
          </div>
          <div className="bg-secondary/50 rounded-xl p-6 mb-6 text-left rtl:text-right space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t('verify.serialNumber')}
              </span>
              <span className="font-mono font-medium">
                {diplomaData.serialNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t('verify.program')}
              </span>
              <span className="font-medium">{diplomaData.program}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t('verify.specialty')}
              </span>
              <span className="font-medium">{diplomaData.specialty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t('verify.issueDate')}
              </span>
              <span className="font-medium">{diplomaData.issueDate}</span>
            </div>
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {t('student.verifiedAuthentic')}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => setShowPreview(true)}
            >
              {t('diploma.previewTitle')}
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleDownload}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
                  {t('diploma.generating')}
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" />
                  {t('student.downloadDiploma')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden diploma template for PDF generation */}
      <div className="fixed -left-[9999px] top-0">
        <DiplomaTemplate ref={diplomaRef} {...diplomaData} />
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{t('diploma.previewTitle')}</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto flex justify-center py-4">
            <div className="transform scale-[0.6] origin-top">
              <DiplomaTemplate {...diplomaData} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleDownload} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('diploma.generating')}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {t('common.download')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
