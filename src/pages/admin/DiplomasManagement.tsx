import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { diplomas, students } from '@/data/mockData';
import { Award, Download, FileText, Search, Eye, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { DiplomaTemplate } from '@/components/diploma/DiplomaTemplate';
import { generateDiplomaPdf } from '@/utils/generateDiplomaPdf';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function DiplomasManagement() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDiploma, setSelectedDiploma] = useState<typeof diplomas[0] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const diplomaRef = useRef<HTMLDivElement>(null);

  const graduatedStudents = students.filter((s) => s.status === 'graduated');
  const filteredDiplomas = diplomas.filter(
    (d) =>
      d.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = (diploma: typeof diplomas[0]) => {
    setSelectedDiploma(diploma);
    toast({ title: t('admin.generateDiploma'), description: diploma.studentName });
  };

  const handlePreview = (diploma: typeof diplomas[0]) => {
    setSelectedDiploma(diploma);
    setShowPreview(true);
  };

  const handleDownload = async () => {
    if (!diplomaRef.current || !selectedDiploma) return;

    setIsGenerating(true);
    try {
      await generateDiplomaPdf(
        diplomaRef.current,
        `diploma-${selectedDiploma.serialNumber}.pdf`
      );
      toast({
        title: t('diploma.downloadSuccess'),
        description: selectedDiploma.serialNumber,
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
    <DashboardLayout role="admin">
      <PageHeader
        title={t('admin.diplomaManagement')}
        description={t('admin.diplomaManagementDesc')}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/admin' },
          { label: t('nav.diplomas') },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('admin.totalIssued')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {diplomas.filter((d) => d.status === 'issued').length}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 rounded-xl">
              <FileText className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('admin.pending')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {diplomas.filter((d) => d.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-xl">
              <Award className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('admin.graduatesReady')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {graduatedStudents.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
        <Input
          placeholder={`${t('common.search')}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rtl:pl-3 rtl:pr-10"
        />
      </div>

      <div className="table-container">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            {t('admin.diplomaRegistry')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">
                  {t('verify.serialNumber')}
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">
                  {t('table.name')}
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">
                  {t('table.program')}
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">
                  {t('table.specialty')}
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">
                  {t('verify.issueDate')}
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">
                  {t('table.status')}
                </th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground rtl:text-left">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDiplomas.map((diploma) => (
                <tr
                  key={diploma.id}
                  className="border-b border-border hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4 font-mono text-sm text-primary">
                    {diploma.serialNumber}
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    {diploma.studentName}
                  </td>
                  <td className="p-4 text-sm text-foreground">
                    {diploma.program}
                  </td>
                  <td className="p-4 text-sm text-foreground">
                    {diploma.specialty}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {diploma.issueDate || '-'}
                  </td>
                  <td className="p-4">
                    <StatusBadge
                      status={t(`status.${diploma.status}`)}
                      variant={getStatusVariant(diploma.status)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2 rtl:justify-start">
                      {diploma.status === 'pending' ? (
                        <Button
                          size="sm"
                          onClick={() => handleGenerate(diploma)}
                        >
                          <Award className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />{' '}
                          {t('admin.generateDiploma')}
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(diploma)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDiploma(diploma);
                              setTimeout(handleDownload, 100);
                            }}
                          >
                            <Download className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />{' '}
                            {t('common.download')}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden diploma template for PDF generation */}
      {selectedDiploma && (
        <div className="fixed -left-[9999px] top-0">
          <DiplomaTemplate
            ref={diplomaRef}
            studentName={selectedDiploma.studentName}
            program={selectedDiploma.program}
            specialty={selectedDiploma.specialty}
            serialNumber={selectedDiploma.serialNumber}
            issueDate={selectedDiploma.issueDate || new Date().toLocaleDateString()}
          />
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{t('diploma.previewTitle')}</DialogTitle>
          </DialogHeader>
          {selectedDiploma && (
            <>
              <div className="overflow-x-auto flex justify-center py-4">
                <div className="transform scale-[0.6] origin-top">
                  <DiplomaTemplate
                    studentName={selectedDiploma.studentName}
                    program={selectedDiploma.program}
                    specialty={selectedDiploma.specialty}
                    serialNumber={selectedDiploma.serialNumber}
                    issueDate={selectedDiploma.issueDate || new Date().toLocaleDateString()}
                  />
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
