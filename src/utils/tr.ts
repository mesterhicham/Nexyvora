import i18n from '@/i18n';
import { frTranslationsMap } from './frTranslationsMap';

/**
 * Universal trilingual translation helper for inline text ternaries.
 * 
 * - If current language is Arabic ('ar'): returns arText
 * - If current language is French ('fr'):
 *     1. Returns frText if explicitly provided.
 *     2. Looks up clean English phrase in frTranslationsMap.
 *     3. Looks up clean Arabic phrase in frTranslationsMap.
 *     4. Falls back to enText.
 * - Otherwise (English or other): returns enText.
 */
export function tr(arText: string, enText: string, frText?: string): string {
  const currentLang = i18n.language || 'ar';
  
  if (currentLang === 'ar') {
    return arText;
  }
  
  if (currentLang === 'fr') {
    if (frText) return frText;
    
    const cleanEn = (enText || '').trim();
    if (cleanEn && frTranslationsMap[cleanEn]) {
      return frTranslationsMap[cleanEn];
    }
    
    const cleanAr = (arText || '').trim();
    if (cleanAr && frTranslationsMap[cleanAr]) {
      return frTranslationsMap[cleanAr];
    }
    
    return enText;
  }
  
  return enText;
}

export default tr;
