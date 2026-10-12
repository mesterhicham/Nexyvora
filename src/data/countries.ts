export interface Country {
  code: string;
  name: string;
  nameAr: string;
}

const RAW_COUNTRIES: Country[] = [
  // --- 1. دول أوروبا الغربية والوسطى والشرقية والبلقان ---
  { code: 'AT', name: 'Austria', nameAr: 'النمسا' },
  { code: 'IE', name: 'Ireland', nameAr: 'أيرلندا' },
  { code: 'PT', name: 'Portugal', nameAr: 'البرتغال' },
  { code: 'LU', name: 'Luxembourg', nameAr: 'لوكسمبورغ' },
  { code: 'GR', name: 'Greece', nameAr: 'اليونان' },
  { code: 'PL', name: 'Poland', nameAr: 'بولندا' },
  { code: 'CZ', name: 'Czech Republic', nameAr: 'التشيك' },
  { code: 'HU', name: 'Hungary', nameAr: 'المجر' },
  { code: 'RO', name: 'Romania', nameAr: 'رومانيا' },
  { code: 'BG', name: 'Bulgaria', nameAr: 'بلغاريا' },
  { code: 'UA', name: 'Ukraine', nameAr: 'أوكرانيا' },
  { code: 'HR', name: 'Croatia', nameAr: 'كرواتيا' },
  { code: 'RS', name: 'Serbia', nameAr: 'صربيا' },
  { code: 'FR', name: 'France', nameAr: 'فرنسا' },
  { code: 'DE', name: 'Germany', nameAr: 'ألمانيا' },
  { code: 'ES', name: 'Spain', nameAr: 'إسبانيا' },
  { code: 'IT', name: 'Italy', nameAr: 'إيطاليا' },
  { code: 'GB', name: 'UK', nameAr: 'المملكة المتحدة' },
  { code: 'BE', name: 'Belgium', nameAr: 'بلجيكا' },
  { code: 'NL', name: 'Netherlands', nameAr: 'هولندا' },
  { code: 'CH', name: 'Switzerland', nameAr: 'سويسرا' },
  { code: 'SE', name: 'Sweden', nameAr: 'السويد' },
  { code: 'NO', name: 'Norway', nameAr: 'النرويج' },
  { code: 'DK', name: 'Denmark', nameAr: 'الدنمارك' },
  { code: 'FI', name: 'Finland', nameAr: 'فنلندا' },
  { code: 'AL', name: 'Albania', nameAr: 'ألبانيا' },
  { code: 'RU', name: 'Russia', nameAr: 'روسيا' },

  // --- 2. دول آسيا (شرق، جنوب شرق، وسط، جنوب، وغرب آسيا) ---
  { code: 'JP', name: 'Japan', nameAr: 'اليابان' },
  { code: 'KR', name: 'South Korea', nameAr: 'كوريا الجنوبية' },
  { code: 'SG', name: 'Singapore', nameAr: 'سنغافورة' },
  { code: 'TH', name: 'Thailand', nameAr: 'تايلاند' },
  { code: 'VN', name: 'Vietnam', nameAr: 'فيتنام' },
  { code: 'PH', name: 'Philippines', nameAr: 'الفلبين' },
  { code: 'AF', name: 'Afghanistan', nameAr: 'أفغانستان' },
  { code: 'BD', name: 'Bangladesh', nameAr: 'بنغلاديش' },
  { code: 'LK', name: 'Sri Lanka', nameAr: 'سريلانكا' },
  { code: 'KZ', name: 'Kazakhstan', nameAr: 'كازاخستان' },
  { code: 'UZ', name: 'Uzbekistan', nameAr: 'أوزبكستان' },
  { code: 'CN', name: 'China', nameAr: 'الصين' },
  { code: 'IN', name: 'India', nameAr: 'الهند' },
  { code: 'ID', name: 'Indonesia', nameAr: 'إندونيسيا' },
  { code: 'MY', name: 'Malaysia', nameAr: 'ماليزيا' },
  { code: 'PK', name: 'Pakistan', nameAr: 'باكستان' },
  { code: 'TR', name: 'Turkey', nameAr: 'تركيا' },
  { code: 'IR', name: 'Iran', nameAr: 'إيران' },

  // --- 3. دول العالم العربي ---
  { code: 'MA', name: 'Morocco', nameAr: 'المغرب' },
  { code: 'DZ', name: 'Algeria', nameAr: 'الجزائر' },
  { code: 'TN', name: 'Tunisia', nameAr: 'تونس' },
  { code: 'LY', name: 'Libya', nameAr: 'ليبيا' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر' },
  { code: 'SD', name: 'Sudan', nameAr: 'السودان' },
  { code: 'MR', name: 'Mauritania', nameAr: 'موريتانيا' },
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية' },
  { code: 'AE', name: 'UAE', nameAr: 'الإمارات العربية المتحدة' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت' },
  { code: 'OM', name: 'Oman', nameAr: 'سلطنة عمان' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن' },
  { code: 'IQ', name: 'Iraq', nameAr: 'العراق' },
  { code: 'LB', name: 'Lebanon', nameAr: 'لبنان' },
  { code: 'PS', name: 'Palestine', nameAr: 'فلسطين' },
  { code: 'SY', name: 'Syria', nameAr: 'سوريا' },
  { code: 'YE', name: 'Yemen', nameAr: 'اليمن' },

  // --- 4. دول أفريقيا (الأفريقية غير العربية) ---
  { code: 'NG', name: 'Nigeria', nameAr: 'نيجيريا' },
  { code: 'GH', name: 'Ghana', nameAr: 'غانا' },
  { code: 'SN', name: 'Senegal', nameAr: 'السنغال' },
  { code: 'KE', name: 'Kenya', nameAr: 'كينيا' },
  { code: 'ET', name: 'Ethiopia', nameAr: 'إثيوبيا' },
  { code: 'UG', name: 'Uganda', nameAr: 'أوغندا' },
  { code: 'CI', name: 'Ivory Coast', nameAr: 'ساحل العاج' },
  { code: 'ZA', name: 'South Africa', nameAr: 'جنوب أفريقيا' },
  { code: 'AO', name: 'Angola', nameAr: 'أنغولا' },
  { code: 'ZW', name: 'Zimbabwe', nameAr: 'زيمبابوي' },

  // --- 5. دول أمريكا اللاتينية والكاريبي والأمريكتين ---
  { code: 'US', name: 'USA', nameAr: 'الولايات المتحدة الأمريكية' },
  { code: 'CA', name: 'Canada', nameAr: 'كندا' },
  { code: 'MX', name: 'Mexico', nameAr: 'المكسيك' },
  { code: 'BR', name: 'Brazil', nameAr: 'البرازيل' },
  { code: 'AR', name: 'Argentina', nameAr: 'الأرجنتين' },
  { code: 'CO', name: 'Colombia', nameAr: 'كولومبيا' },
  { code: 'CL', name: 'Chile', nameAr: 'تشيلي' },
  { code: 'PE', name: 'Peru', nameAr: 'بيرو' },
  { code: 'UY', name: 'Uruguay', nameAr: 'أوروغواي' },
  { code: 'VE', name: 'Venezuela', nameAr: 'فينزويلا' },
  { code: 'CU', name: 'Cuba', nameAr: 'كوبا' },
  { code: 'JM', name: 'Jamaica', nameAr: 'جامايكا' },
  { code: 'PA', name: 'Panama', nameAr: 'بنما' },
  { code: 'CR', name: 'Costa Rica', nameAr: 'كوستاريكا' },

  // --- 6. دول أوقيانوسيا ---
  { code: 'AU', name: 'Australia', nameAr: 'أستراليا' },
  { code: 'NZ', name: 'New Zealand', nameAr: 'نيوزيلندا' },
  { code: 'FJ', name: 'Fiji', nameAr: 'فيجي' },
];

// Sort alphabetically by Arabic name
export const COUNTRIES: Country[] = [...RAW_COUNTRIES].sort((a, b) =>
  a.nameAr.localeCompare(b.nameAr, 'ar')
);
