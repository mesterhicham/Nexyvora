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
    const verificationUrl = `${window.location.origin}/verify?serial=${encodeURIComponent(serialNumber)}`;

    return (
      <div
        ref={ref}
        id="nexyvora-diploma-certificate"
        className="relative bg-[#ffffff] w-[842px] h-[595px] overflow-hidden text-[#0b132b] select-none shadow-2xl"
        style={{
          fontFamily: isRTL ? "'Amiri', 'Traditional Arabic', serif" : "'Playfair Display', 'Cinzel', 'Times New Roman', Georgia, serif",
          direction: isRTL ? 'rtl' : 'ltr',
          background: 'radial-gradient(ellipse at center, #ffffff 0%, #fdfcf9 60%, #f7f3e8 100%)',
        }}
      >
        {/* ================= BACKGROUND PATTERNS & GUILLOCHÉ ================= */}
        {/* Subtle geometric security mesh */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #0b132b 1px, transparent 0), radial-gradient(circle at 14px 14px, #c5a059 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Guilloché rosette circular watermark in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
          <svg width="460" height="460" viewBox="0 0 200 200" fill="none" stroke="#0b132b" strokeWidth="0.5">
            <circle cx="100" cy="100" r="95" strokeDasharray="2,2" />
            <circle cx="100" cy="100" r="80" />
            <circle cx="100" cy="100" r="65" strokeDasharray="3,3" />
            <circle cx="100" cy="100" r="50" />
            <circle cx="100" cy="100" r="35" strokeDasharray="1,2" />
            {/* Guilloché polygon stars */}
            {[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165].map((deg) => (
              <ellipse
                key={deg}
                cx="100"
                cy="100"
                rx="85"
                ry="38"
                transform={`rotate(${deg} 100 100)`}
                stroke="#c5a059"
                strokeWidth="0.35"
              />
            ))}
          </svg>
        </div>

        {/* Central Large Watermark Monogram "N" */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
          <span className="text-[320px] font-black text-[#0b132b] tracking-tighter" style={{ fontFamily: "'Inter', sans-serif" }}>
            N
          </span>
        </div>

        {/* ================= ORNATE BORDERS ================= */}
        {/* Outermost solid Navy luxury border */}
        <div className="absolute inset-[10px] border-[3px] border-[#0b132b]" />

        {/* Second gold hairline border */}
        <div className="absolute inset-[16px] border border-[#d4af37]" />

        {/* Third inner decorative thin border */}
        <div className="absolute inset-[20px] border border-[#0b132b]/25" />

        {/* Golden outer corner flourishes */}
        {/* Top-Left */}
        <div className="absolute top-[18px] left-[18px] pointer-events-none">
          <svg width="45" height="45" viewBox="0 0 45 45" fill="none">
            <path d="M2 43 V10 C2 5.578 5.578 2 10 2 H43" stroke="#c5a059" strokeWidth="2.5" />
            <path d="M7 40 V14 C7 10.134 10.134 7 14 7 H40" stroke="#d4af37" strokeWidth="1" strokeDasharray="2,2" />
            <circle cx="10" cy="10" r="3" fill="#c5a059" />
            <polygon points="10,4 12,10 18,10 13,14 15,20 10,16 5,20 7,14 2,10 8,10" fill="#d4af37" transform="scale(0.55) translate(4, 4)" />
          </svg>
        </div>

        {/* Top-Right */}
        <div className="absolute top-[18px] right-[18px] pointer-events-none">
          <svg width="45" height="45" viewBox="0 0 45 45" fill="none" className="rotate-90">
            <path d="M2 43 V10 C2 5.578 5.578 2 10 2 H43" stroke="#c5a059" strokeWidth="2.5" />
            <path d="M7 40 V14 C7 10.134 10.134 7 14 7 H40" stroke="#d4af37" strokeWidth="1" strokeDasharray="2,2" />
            <circle cx="10" cy="10" r="3" fill="#c5a059" />
            <polygon points="10,4 12,10 18,10 13,14 15,20 10,16 5,20 7,14 2,10 8,10" fill="#d4af37" transform="scale(0.55) translate(4, 4)" />
          </svg>
        </div>

        {/* Bottom-Left */}
        <div className="absolute bottom-[18px] left-[18px] pointer-events-none">
          <svg width="45" height="45" viewBox="0 0 45 45" fill="none" className="-rotate-90">
            <path d="M2 43 V10 C2 5.578 5.578 2 10 2 H43" stroke="#c5a059" strokeWidth="2.5" />
            <path d="M7 40 V14 C7 10.134 10.134 7 14 7 H40" stroke="#d4af37" strokeWidth="1" strokeDasharray="2,2" />
            <circle cx="10" cy="10" r="3" fill="#c5a059" />
            <polygon points="10,4 12,10 18,10 13,14 15,20 10,16 5,20 7,14 2,10 8,10" fill="#d4af37" transform="scale(0.55) translate(4, 4)" />
          </svg>
        </div>

        {/* Bottom-Right */}
        <div className="absolute bottom-[18px] right-[18px] pointer-events-none">
          <svg width="45" height="45" viewBox="0 0 45 45" fill="none" className="rotate-180">
            <path d="M2 43 V10 C2 5.578 5.578 2 10 2 H43" stroke="#c5a059" strokeWidth="2.5" />
            <path d="M7 40 V14 C7 10.134 10.134 7 14 7 H40" stroke="#d4af37" strokeWidth="1" strokeDasharray="2,2" />
            <circle cx="10" cy="10" r="3" fill="#c5a059" />
            <polygon points="10,4 12,10 18,10 13,14 15,20 10,16 5,20 7,14 2,10 8,10" fill="#d4af37" transform="scale(0.55) translate(4, 4)" />
          </svg>
        </div>

        {/* Decorative Middle Diamond Accents */}
        <div className="absolute top-1/2 left-[12px] -translate-y-1/2 flex flex-col items-center gap-1.5 opacity-80">
          <div className="w-[6px] h-[6px] bg-[#c5a059] rotate-45" />
          <div className="w-[1px] h-[30px] bg-gradient-to-b from-[#c5a059] to-transparent" />
        </div>
        <div className="absolute top-1/2 right-[12px] -translate-y-1/2 flex flex-col items-center gap-1.5 opacity-80">
          <div className="w-[6px] h-[6px] bg-[#c5a059] rotate-45" />
          <div className="w-[1px] h-[30px] bg-gradient-to-b from-[#c5a059] to-transparent" />
        </div>

        {/* ================= MAIN CERTIFICATE CONTENT ================= */}
        <div className="relative z-10 h-full flex flex-col justify-between py-[30px] px-[55px]">
          
          {/* TOP SECTION: ACADEMY CREST & TITLE */}
          <div className="text-center flex flex-col items-center">
            {/* Modern NEXYVORA Crest */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="relative">
                {/* Shield / Diamond Badge */}
                <div
                  className="w-[46px] h-[46px] rounded-xl flex items-center justify-center shadow-lg transform rotate-45 border border-[#d4af37]"
                  style={{
                    background: 'linear-gradient(135deg, #0b132b 0%, #1c2e4a 60%, #0b132b 100%)',
                    boxShadow: '0 4px 14px rgba(11, 19, 43, 0.35)',
                  }}
                >
                  <span
                    className="text-[#d4af37] text-2xl font-black -rotate-45"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      textShadow: '0 1px 3px rgba(212, 175, 55, 0.5)',
                    }}
                  >
                    N
                  </span>
                </div>
                {/* Micro gold ring badge */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#d4af37] border-2 border-white flex items-center justify-center shadow">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0b132b]" />
                </div>
              </div>
            </div>

            {/* Institution Name */}
            <h1
              className="text-[26px] font-black text-[#0b132b] uppercase tracking-[0.22em] leading-tight"
              style={{ fontFamily: "'Inter', 'Montserrat', sans-serif" }}
            >
              {t('diploma.academyName', 'NEXYVORA')}
            </h1>

            {/* Subtitle & Golden Divider */}
            <div className="flex items-center justify-center gap-3 mt-1.5 max-w-[500px]">
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#c5a059] to-[#c5a059]" />
              <p
                className="text-[#84755a] text-[9.5px] font-bold tracking-[0.3em] uppercase whitespace-nowrap"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {t('diploma.subtitle', 'Professional & Academic Excellence')}
              </p>
              <div className="w-16 h-[1px] bg-gradient-to-l from-transparent via-[#c5a059] to-[#c5a059]" />
            </div>
          </div>

          {/* DIPLOMA TITLE & CERTIFICATION STATEMENT */}
          <div className="text-center -mt-1">
            <div className="inline-block relative">
              <h2
                className="text-[34px] font-bold tracking-[0.35em] uppercase text-transparent bg-clip-text"
                style={{
                  fontFamily: isRTL ? "'Amiri', serif" : "'Playfair Display', Georgia, serif",
                  backgroundImage: 'linear-gradient(135deg, #87611e 0%, #c5a059 40%, #e6ca65 60%, #99732b 100%)',
                  textShadow: '0 1px 1px rgba(255,255,255,0.7)',
                }}
              >
                {t('diploma.certificate', 'Diploma')}
              </h2>
              {/* Ornamental underline flourish */}
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <div className="w-8 h-[1px] bg-[#c5a059]/60" />
                <div className="w-1.5 h-1.5 bg-[#c5a059] rotate-45" />
                <div className="w-8 h-[1px] bg-[#c5a059]/60" />
              </div>
            </div>

            <p
              className="text-[#64748b] text-[12px] font-medium tracking-wide mt-1.5 italic"
              style={{ fontFamily: isRTL ? "'Amiri', serif" : "'Playfair Display', Georgia, serif" }}
            >
              {t('diploma.certifyThat', 'This is to certify that')}
            </p>
          </div>

          {/* STUDENT NAME */}
          <div className="text-center my-0.5">
            <div className="inline-block px-10 pb-1 relative">
              <h3
                className="text-[34px] font-bold text-[#0b132b] tracking-wide"
                style={{
                  fontFamily: isRTL ? "'Amiri', serif" : "'Playfair Display', 'Times New Roman', serif",
                }}
              >
                {studentName}
              </h3>
              {/* Luxury Triple Underline */}
              <div className="w-full flex items-center justify-center mt-1">
                <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#c5a059] to-transparent" />
              </div>
            </div>
          </div>

          {/* DEGREE & SPECIALTY DETAILS */}
          <div className="text-center max-w-[560px] mx-auto">
            <p
              className="text-[#334155] text-[12.5px] leading-[1.75]"
              style={{ fontFamily: isRTL ? "'Amiri', serif" : "'Inter', sans-serif" }}
            >
              {t('diploma.hasCompleted', 'has successfully completed the')}{' '}
              <strong className="text-[#0b132b] font-bold text-[13.5px] px-1 border-b border-[#c5a059]/50">
                {program}
              </strong>{' '}
              {t('diploma.programIn', 'program in')}{' '}
              <strong className="text-[#0b132b] font-bold text-[13.5px] px-1 border-b border-[#c5a059]/50">
                {specialty}
              </strong>{' '}
              {t('diploma.withRequirements', 'and has fulfilled all the requirements for graduation.')}
            </p>
          </div>

          {/* FOOTER: SIGNATURES, DATE, AND 3D GOLD EMBOSSED SEAL */}
          <div className="w-full flex items-end justify-between px-4 pt-1">
            
            {/* LEFT: Academic Director Signature */}
            <div className="text-center w-[160px] flex flex-col items-center">
              {/* Handwritten signature SVG for realism */}
              <div className="h-[36px] w-[130px] flex items-center justify-center mb-1">
                <svg width="120" height="34" viewBox="0 0 120 34" fill="none">
                  <path
                    d="M10 24 C 25 10, 30 5, 42 18 C 50 28, 55 12, 68 8 C 80 4, 85 26, 96 16 C 102 10, 110 14, 115 12"
                    stroke="#1e293b"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M32 18 C 45 16, 75 14, 90 20"
                    stroke="#1e293b"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="w-full border-t border-[#0b132b]/40 pt-1">
                <p
                  className="text-[11px] font-bold text-[#0b132b] tracking-wider uppercase"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {t('diploma.director', 'Academic Director')}
                </p>
                <p className="text-[8.5px] text-[#84755a] font-medium tracking-wide uppercase">
                  NEXYVORA ACADEMY
                </p>
              </div>
            </div>

            {/* CENTER: 3D LUXURY GOLD EMBOSSED SEAL */}
            <div className="text-center flex flex-col items-center -mb-1">
              <div className="relative flex items-center justify-center">
                {/* Ribbon tails hanging below seal */}
                <div className="absolute -bottom-3 flex justify-center gap-2 pointer-events-none">
                  <div
                    className="w-4 h-7 bg-[#99732b] transform -rotate-12"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
                  />
                  <div
                    className="w-4 h-7 bg-[#c5a059] transform rotate-12"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
                  />
                </div>

                {/* Circular Gold Seal Medallion */}
                <div
                  className="w-[74px] h-[74px] rounded-full relative z-10 flex items-center justify-center shadow-lg border-[2px] border-[#e6ca65]"
                  style={{
                    background: 'radial-gradient(circle at 35% 30%, #fef3c7 0%, #d4af37 40%, #b48a28 75%, #856114 100%)',
                    boxShadow: '0 4px 15px rgba(180, 138, 40, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.7), inset 0 -2px 4px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Outer notched star ring */}
                  <div className="w-[64px] h-[64px] rounded-full border border-dashed border-[#ffffff]/70 flex items-center justify-center">
                    <div className="w-[54px] h-[54px] rounded-full border border-[#ffffff]/60 flex flex-col items-center justify-center text-center p-1">
                      <span className="text-[6.5px] font-black text-[#ffffff] tracking-widest leading-none uppercase drop-shadow">
                        OFFICIAL
                      </span>
                      <span className="text-[14px] font-black text-[#0b132b] my-0.5 leading-none" style={{ fontFamily: "'Inter', sans-serif" }}>
                        ★ N ★
                      </span>
                      <span className="text-[6px] font-bold text-[#ffffff] tracking-widest leading-none uppercase drop-shadow">
                        CERTIFIED
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issue Date & Cohort below seal */}
              <div className="mt-4">
                <p className="text-[9px] text-[#64748b] tracking-wider uppercase font-semibold">
                  {t('diploma.issuedOn', 'Issued on')}: <span className="text-[#0b132b] font-bold">{issueDate}</span>
                </p>
                {cohort && (
                  <p className="text-[8.5px] text-[#84755a] font-medium tracking-wide">
                    {t('table.cohort', 'Cohort')}: {cohort}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT: Dean / Registrar Signature */}
            <div className="text-center w-[160px] flex flex-col items-center">
              {/* Realistic handwritten registrar signature SVG */}
              <div className="h-[36px] w-[130px] flex items-center justify-center mb-1">
                <svg width="120" height="34" viewBox="0 0 120 34" fill="none">
                  <path
                    d="M15 22 C 28 8, 38 30, 48 14 C 54 6, 62 18, 75 12 C 86 6, 92 24, 108 14"
                    stroke="#1e293b"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 25 L 85 23"
                    stroke="#1e293b"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="w-full border-t border-[#0b132b]/40 pt-1">
                <p
                  className="text-[11px] font-bold text-[#0b132b] tracking-wider uppercase"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {t('diploma.registrar', 'Dean of Academic Affairs')}
                </p>
                <p className="text-[8.5px] text-[#84755a] font-medium tracking-wide uppercase">
                  REGISTRAR OFFICE
                </p>
              </div>
            </div>

          </div>

          {/* BOTTOM BAR: SERIAL NUMBER & QR CODE VERIFICATION */}
          <div className="pt-2 border-t border-[#c5a059]/30 flex items-center justify-between text-[8px] text-[#64748b]">
            {/* Left: Security Checksum / Protocol info */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#0b132b] font-bold tracking-wider">
                {t('verify.serialNumber', 'Serial No')}: {serialNumber}
              </span>
              <span className="text-[#c5a059]">•</span>
              <span className="uppercase tracking-widest text-[7px] text-[#84755a]">
                NEXYVORA DIGITAL TRUST PROTOCOL
              </span>
            </div>

            {/* Right: Micro QR code & Scan link */}
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider text-[7px] font-semibold text-[#84755a]">
                {t('diploma.scanToVerify', 'Scan to Verify')}
              </span>
              <div className="p-1 bg-white rounded border border-[#c5a059]/40 shadow-sm">
                <QRCodeSVG
                  value={verificationUrl}
                  size={28}
                  level="M"
                  includeMargin={false}
                  fgColor="#0b132b"
                  bgColor="#ffffff"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }
);

DiplomaTemplate.displayName = 'DiplomaTemplate';
