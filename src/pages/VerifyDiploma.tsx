import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlatformLogo } from '@/components/PlatformLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Search, ArrowLeft, CheckCircle, XCircle, Award, Eye } from 'lucide-react';
import { diplomas } from '@/data/mockData';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { DiplomaTemplate } from '@/components/diploma/DiplomaTemplate';

export default function VerifyDiploma() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [serialNumber, setSerialNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState<'valid' | 'invalid' | null>(null);
  const [foundDiploma, setFoundDiploma] = useState<typeof diplomas[0] | null>(null);
  const [showCertificatePreview, setShowCertificatePreview] = useState(false);

  useEffect(() => {
    const querySerial = searchParams.get('serial');
    if (querySerial) {
      setSerialNumber(querySerial);
      const diploma = diplomas.find(
        (d) => d.serialNumber.toLowerCase() === querySerial.toLowerCase() && d.status === 'issued'
      );
      if (diploma) {
        setVerificationResult('valid');
        setFoundDiploma(diploma);
      } else {
        setVerificationResult('invalid');
        setFoundDiploma(null);
      }
    }
  }, [searchParams]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const diploma = diplomas.find(
      (d) => d.serialNumber.toLowerCase() === serialNumber.toLowerCase() && d.status === 'issued'
    );
    if (diploma) {
      setVerificationResult('valid');
      setFoundDiploma(diploma);
    } else {
      setVerificationResult('invalid');
      setFoundDiploma(null);
    }
  };

  const resetSearch = () => {
    setSerialNumber('');
    setVerificationResult(null);
    setFoundDiploma(null);
    setShowCertificatePreview(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/">
              <PlatformLogo />
            </Link>
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="compact" />
              <Link to="/login">
                <Button variant="outline">{t('common.signIn')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('common.backToHome')}
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
            <Award className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('verify.title')}</h1>
          <p className="text-muted-foreground">{t('verify.subtitle')}</p>
        </div>

        {/* Verification Form */}
        <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serial" className="text-base">{t('verify.serialNumber')}</Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:left-auto rtl:right-4" />
                <Input
                  id="serial"
                  placeholder="DIP-2024-001"
                  value={serialNumber}
                  onChange={(e) => {
                    setSerialNumber(e.target.value);
                    setVerificationResult(null);
                  }}
                  className="pl-12 h-14 text-lg rtl:pl-4 rtl:pr-12"
                />
              </div>
              <p className="text-sm text-muted-foreground">{t('verify.serialHint')}</p>
            </div>

            <Button type="submit" size="lg" className="w-full">
              {t('verify.verifyButton')}
            </Button>
          </form>

          {/* Verification Result */}
          {verificationResult && (
            <div className="mt-8 animate-fade-in">
              {verificationResult === 'valid' && foundDiploma ? (
                <div className="bg-success/10 border border-success/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-success rounded-full">
                      <CheckCircle className="h-6 w-6 text-success-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-success">{t('verify.validDiploma')}</h3>
                      <p className="text-sm text-muted-foreground">{t('verify.validDesc')}</p>
                    </div>
                  </div>
                  
                  <div className="bg-card rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t('verify.serialNumber')}</p>
                        <p className="font-medium text-foreground">{foundDiploma.serialNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('verify.issueDate')}</p>
                        <p className="font-medium text-foreground">{foundDiploma.issueDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('verify.graduateName')}</p>
                        <p className="font-medium text-foreground">{foundDiploma.studentName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('verify.program')}</p>
                        <p className="font-medium text-foreground">{foundDiploma.program}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">{t('verify.specialty')}</p>
                        <p className="font-medium text-foreground">{foundDiploma.specialty}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCertificatePreview(!showCertificatePreview)}
                      className="w-full gap-2 border-success/30 text-emerald-600 dark:text-emerald-400 hover:bg-success/10"
                    >
                      <Eye className="h-4 w-4" />
                      {showCertificatePreview ? (t('diploma.hidePreview', 'إخفاء معاينة الشهادة')) : (t('diploma.viewCertificate', 'عرض الشهادة الرقمية المعتمدة'))}
                    </Button>
                    {showCertificatePreview && (
                      <div className="mt-4 overflow-x-auto flex justify-center py-4 bg-muted/40 rounded-2xl border border-border">
                        <div className="transform scale-[0.45] sm:scale-[0.6] origin-top my-2">
                          <DiplomaTemplate
                            studentName={foundDiploma.studentName}
                            program={foundDiploma.program}
                            specialty={foundDiploma.specialty}
                            serialNumber={foundDiploma.serialNumber}
                            issueDate={foundDiploma.issueDate}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive rounded-full">
                      <XCircle className="h-6 w-6 text-destructive-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-destructive">{t('verify.invalidDiploma')}</h3>
                      <p className="text-sm text-muted-foreground">{t('verify.invalidDesc')}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button variant="outline" onClick={resetSearch} className="mt-4 w-full">
                {t('verify.verifyAnother')}
              </Button>
            </div>
          )}
        </div>

        {/* Sample Serial Numbers for Demo */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="mb-2">{t('verify.demoSerials')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {diplomas.filter(d => d.status === 'issued').map((d) => (
              <button
                key={d.serialNumber}
                onClick={() => setSerialNumber(d.serialNumber)}
                className="px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
              >
                {d.serialNumber}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
