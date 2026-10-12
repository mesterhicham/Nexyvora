import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';

interface DiplomaTemplateProps {
  studentName: string;
  program: string;
  specialty: string;
  serialNumber: string;
  issueDate: string;
  cohort?: string;
}

export const DiplomaTemplate = forwardRef<HTMLDivElement, DiplomaTemplateProps>(
  ({ studentName, program, specialty, serialNumber, issueDate, cohort }, ref) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    // Generate verification URL with serial number
    const verificationUrl = `${window.location.origin}/verify?serial=${serialNumber}`;

    return (
      <div
        ref={ref}
        className="bg-white p-8 w-[800px] h-[600px] relative overflow-hidden"
        style={{
          fontFamily: isRTL ? 'Amiri, serif' : 'Playfair Display, serif',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        {/* Decorative Border */}
        <div className="absolute inset-4 border-4 border-[#0f2557] rounded-lg" />
        <div className="absolute inset-6 border-2 border-[#d4af37] rounded-lg" />
        
        {/* Corner Decorations */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-[#d4af37] rounded-tl-lg" />
        <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-[#d4af37] rounded-tr-lg" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-[#d4af37] rounded-bl-lg" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-[#d4af37] rounded-br-lg" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-between py-12 px-16">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#0f2557] rounded-full flex items-center justify-center">
                <span className="text-[#d4af37] text-xl font-bold">E</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-[#0f2557] tracking-wider uppercase">
              {t('diploma.academyName')}
            </h1>
            <p className="text-[#666] text-sm mt-1 tracking-widest uppercase">
              {t('diploma.subtitle')}
            </p>
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-4xl font-bold text-[#d4af37] tracking-wider uppercase mb-2">
              {t('diploma.certificate')}
            </h2>
            <p className="text-[#0f2557] text-lg tracking-wide">
              {t('diploma.certifyThat')}
            </p>
          </div>

          {/* Student Name */}
          <div className="text-center">
            <h3 className="text-4xl font-bold text-[#0f2557] border-b-2 border-[#d4af37] pb-2 px-8">
              {studentName}
            </h3>
          </div>

          {/* Achievement */}
          <div className="text-center max-w-lg">
            <p className="text-[#333] text-base leading-relaxed">
              {t('diploma.hasCompleted')} <strong className="text-[#0f2557]">{program}</strong> {t('diploma.programIn')} <strong className="text-[#0f2557]">{specialty}</strong> {t('diploma.withRequirements')}
            </p>
          </div>

          {/* Footer with Signatures */}
          <div className="w-full flex items-end justify-between px-4">
            <div className="text-center">
              <div className="w-32 border-t-2 border-[#333] pt-2">
                <p className="text-sm text-[#666]">{t('diploma.director')}</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-[#666] mb-1">{t('diploma.issuedOn')}</p>
              <p className="font-semibold text-[#0f2557]">{issueDate}</p>
              {cohort && (
                <p className="text-xs text-[#666] mt-1">{t('table.cohort')}: {cohort}</p>
              )}
            </div>

            <div className="text-center">
              <div className="w-32 border-t-2 border-[#333] pt-2">
                <p className="text-sm text-[#666]">{t('diploma.registrar')}</p>
              </div>
            </div>
          </div>

          {/* Serial Number */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <p className="text-xs text-[#999] font-mono tracking-wider">
              {t('verify.serialNumber')}: {serialNumber}
            </p>
          </div>
        </div>

        {/* QR Code for Verification */}
        <div className="absolute bottom-12 right-12 flex flex-col items-center">
          <div className="bg-white p-2 rounded-lg shadow-sm border border-[#d4af37]">
            <QRCodeSVG
              value={verificationUrl}
              size={70}
              level="H"
              includeMargin={false}
              fgColor="#0f2557"
              bgColor="#ffffff"
            />
          </div>
          <p className="text-[8px] text-[#666] mt-1 text-center max-w-[80px]">
            {t('diploma.scanToVerify')}
          </p>
        </div>

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <div className="w-64 h-64 bg-[#0f2557] rounded-full flex items-center justify-center">
            <span className="text-white text-8xl font-bold">E</span>
          </div>
        </div>
      </div>
    );
  }
);

DiplomaTemplate.displayName = 'DiplomaTemplate';
