import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';

interface FormationCertificateProps {
  studentName: string;
  formationTitle: string;
  completionDate: string;
  certificateId: string;
}

export const FormationCertificate = forwardRef<HTMLDivElement, FormationCertificateProps>(
  ({ studentName, formationTitle, completionDate, certificateId }, ref) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const verificationUrl = `${window.location.origin}/verify?certificate=${certificateId}`;

    return (
      <div
        ref={ref}
        className="bg-white w-[800px] h-[600px] relative overflow-hidden"
        style={{
          fontFamily: isRTL ? 'Amiri, serif' : "'Inter', 'Playfair Display', serif",
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        {/* Background Pattern — subtle geometric grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #0a1628 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }} />

        {/* Top accent bar — gradient strip */}
        <div className="absolute top-0 left-0 right-0 h-[5px]" style={{
          background: 'linear-gradient(90deg, #0a1628 0%, #1a6e4e 25%, #2ecc71 50%, #1a6e4e 75%, #0a1628 100%)',
        }} />

        {/* Bottom accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[5px]" style={{
          background: 'linear-gradient(90deg, #0a1628 0%, #1a6e4e 25%, #2ecc71 50%, #1a6e4e 75%, #0a1628 100%)',
        }} />

        {/* Left vertical accent */}
        <div className="absolute top-0 left-0 bottom-0 w-[5px]" style={{
          background: 'linear-gradient(180deg, #0a1628 0%, #1a6e4e 25%, #2ecc71 50%, #1a6e4e 75%, #0a1628 100%)',
        }} />

        {/* Right vertical accent */}
        <div className="absolute top-0 right-0 bottom-0 w-[5px]" style={{
          background: 'linear-gradient(180deg, #0a1628 0%, #1a6e4e 25%, #2ecc71 50%, #1a6e4e 75%, #0a1628 100%)',
        }} />

        {/* Inner border — thin elegant line */}
        <div className="absolute inset-[14px] border border-[#2ecc71]/30 rounded-sm" />

        {/* Corner ornaments — geometric L-shapes */}
        {/* Top-left */}
        <div className="absolute top-[20px] left-[20px]">
          <div className="w-[40px] h-[2px] bg-[#2ecc71]" />
          <div className="w-[2px] h-[40px] bg-[#2ecc71]" />
        </div>
        {/* Top-right */}
        <div className="absolute top-[20px] right-[20px]">
          <div className="w-[40px] h-[2px] bg-[#2ecc71] ml-auto" />
          <div className="w-[2px] h-[40px] bg-[#2ecc71] ml-auto" />
        </div>
        {/* Bottom-left */}
        <div className="absolute bottom-[20px] left-[20px]">
          <div className="w-[2px] h-[40px] bg-[#2ecc71]" />
          <div className="w-[40px] h-[2px] bg-[#2ecc71]" />
        </div>
        {/* Bottom-right */}
        <div className="absolute bottom-[20px] right-[20px]">
          <div className="w-[2px] h-[40px] bg-[#2ecc71] ml-auto" />
          <div className="w-[40px] h-[2px] bg-[#2ecc71] ml-auto" />
        </div>

        {/* Decorative side diamonds */}
        <div className="absolute top-1/2 left-[10px] -translate-y-1/2 w-[8px] h-[8px] bg-[#2ecc71] rotate-45" />
        <div className="absolute top-1/2 right-[10px] -translate-y-1/2 w-[8px] h-[8px] bg-[#2ecc71] rotate-45" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-between py-10 px-20">
          {/* Header — Logo & Institution */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              {/* Modern logo mark */}
              <div className="relative">
                <div className="w-[50px] h-[50px] rounded-lg bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] flex items-center justify-center shadow-md" style={{
                  boxShadow: '0 2px 12px rgba(10, 22, 40, 0.3)',
                }}>
                  <span className="text-[#2ecc71] text-2xl font-black tracking-tighter" style={{ fontFamily: "'Inter', sans-serif" }}>N</span>
                </div>
                <div className="absolute -bottom-[2px] -right-[2px] w-[10px] h-[10px] bg-[#2ecc71] rounded-full border-2 border-white" />
              </div>
            </div>
            <h1 className="text-[28px] font-black text-[#0a1628] tracking-[0.2em] uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('diploma.academyName')}
            </h1>
            <div className="flex items-center justify-center gap-3 mt-1">
              <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#2ecc71]" />
              <p className="text-[#8a8a8a] text-[10px] tracking-[0.35em] uppercase font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t('diploma.subtitle')}
              </p>
              <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#2ecc71]" />
            </div>
          </div>

          {/* Title — Certificate of Completion */}
          <div className="text-center -mt-2">
            <h2 className="text-[32px] font-light text-[#2ecc71] tracking-[0.35em] uppercase" style={{
              fontFamily: "'Playfair Display', serif",
              textShadow: '0 1px 2px rgba(46, 204, 113, 0.12)',
            }}>
              Certificate of Completion
            </h2>
            <p className="text-[#5a6a7a] text-[13px] tracking-wide mt-1 italic" style={{ fontFamily: "'Playfair Display', serif" }}>
              This is to certify that
            </p>
          </div>

          {/* Student Name */}
          <div className="text-center -mt-2">
            <h3 className="text-[38px] font-bold text-[#0a1628] px-10 pb-2" style={{
              fontFamily: "'Playfair Display', serif",
              borderBottom: '2px solid #2ecc71',
            }}>
              {studentName}
            </h3>
          </div>

          {/* Achievement Text */}
          <div className="text-center max-w-[480px] -mt-2">
            <p className="text-[#4a5568] text-[13px] leading-[1.8]" style={{ fontFamily: "'Inter', sans-serif" }}>
              has successfully completed the formation course
            </p>
            <p className="text-[20px] font-bold text-[#0a1628] mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              "{formationTitle}"
            </p>
          </div>

          {/* Footer — Signatures & Date */}
          <div className="w-full flex items-end justify-between px-6">
            {/* Instructor signature */}
            <div className="text-center">
              <div className="w-28 border-t border-[#0a1628]/30 pt-2">
                <p className="text-[11px] text-[#8a8a8a] font-medium tracking-wider uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Instructor
                </p>
              </div>
            </div>

            {/* Completion date */}
            <div className="text-center">
              <p className="text-[10px] text-[#8a8a8a] mb-1 tracking-wider uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
                Completed on
              </p>
              <p className="font-semibold text-[14px] text-[#0a1628]" style={{ fontFamily: "'Inter', sans-serif" }}>
                {completionDate}
              </p>
            </div>

            {/* Director signature */}
            <div className="text-center">
              <div className="w-28 border-t border-[#0a1628]/30 pt-2">
                <p className="text-[11px] text-[#8a8a8a] font-medium tracking-wider uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Director
                </p>
              </div>
            </div>
          </div>

          {/* Certificate ID */}
          <div className="absolute bottom-[28px] left-1/2 -translate-x-1/2">
            <p className="text-[9px] text-[#b0b0b0] font-mono tracking-[0.15em]">
              Certificate ID: {certificateId}
            </p>
          </div>
        </div>

        {/* QR Code */}
        <div className="absolute bottom-[28px] right-[28px] flex flex-col items-center">
          <div className="bg-white p-[6px] rounded-md border border-[#2ecc71]/30" style={{
            boxShadow: '0 1px 6px rgba(46, 204, 113, 0.12)',
          }}>
            <QRCodeSVG
              value={verificationUrl}
              size={60}
              level="H"
              includeMargin={false}
              fgColor="#0a1628"
              bgColor="#ffffff"
            />
          </div>
          <p className="text-[7px] text-[#8a8a8a] mt-1 text-center tracking-wider uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
            Scan to verify
          </p>
        </div>

        {/* Watermark — large N */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
          <span className="text-[280px] font-black text-[#0a1628]" style={{ fontFamily: "'Inter', sans-serif" }}>N</span>
        </div>
      </div>
    );
  }
);

FormationCertificate.displayName = 'FormationCertificate';
