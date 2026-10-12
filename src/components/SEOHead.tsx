import { useEffect } from 'react';
import { usePlatformSettings } from '@/hooks/useAdminFeatures';

export function SEOHead() {
  const { data: settings } = usePlatformSettings();

  useEffect(() => {
    if (!settings?.map) return;

    const getValue = (key: string) => settings.map[key]?.value || '';

    // Update document title
    const siteTitle = getValue('site_title') || getValue('platform_name');
    if (siteTitle) {
      document.title = siteTitle;
    }

    // Helper to update or create meta tag
    const updateMetaTag = (property: string, content: string, isName = false) => {
      if (!content) return;
      
      const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isName) {
          meta.setAttribute('name', property);
        } else {
          meta.setAttribute('property', property);
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Update meta description
    const siteDescription = getValue('site_description');
    if (siteDescription) {
      updateMetaTag('description', siteDescription, true);
    }

    // Update Open Graph tags
    const ogTitle = getValue('og_title') || siteTitle;
    const ogDescription = getValue('og_description') || siteDescription;
    const ogImage = getValue('og_image');

    if (ogTitle) updateMetaTag('og:title', ogTitle);
    if (ogDescription) updateMetaTag('og:description', ogDescription);
    if (ogImage) updateMetaTag('og:image', ogImage);

    // Update Twitter tags
    const twitterCard = getValue('twitter_card') || 'summary_large_image';
    const twitterSite = getValue('twitter_site');

    updateMetaTag('twitter:card', twitterCard, true);
    if (twitterSite) updateMetaTag('twitter:site', twitterSite, true);
    if (ogImage) updateMetaTag('twitter:image', twitterCard === 'summary_large_image' ? ogImage : '', true);

    // Update favicon
    const faviconUrl = getValue('favicon_url');
    if (faviconUrl) {
      const iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
      if (iconLinks.length > 0) {
        iconLinks.forEach(link => {
          link.href = faviconUrl;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = faviconUrl;
        document.head.appendChild(link);
      }
    }

    // Apply custom theme colors dynamically
    const primaryColor = getValue('primary_color');
    const accentColor = getValue('accent_color');

    const formatHslValues = (col: string) => {
      if (!col) return '';
      const trimmed = col.trim();
      if (trimmed.startsWith('hsl(')) {
        return trimmed.replace(/^hsl\((.*)\)$/, '$1');
      }
      return trimmed;
    };

    const toValidCssColor = (val: string, fallback: string) => {
      if (!val) return fallback;
      const trimmed = val.trim();
      if (trimmed.startsWith('#') || trimmed.startsWith('rgb') || trimmed.startsWith('hsl')) {
        return trimmed;
      }
      return `hsl(${trimmed})`;
    };

    const pHsl = formatHslValues(primaryColor);
    const aHsl = formatHslValues(accentColor);

    if (pHsl) {
      document.documentElement.style.setProperty('--primary', pHsl);
      document.documentElement.style.setProperty('--ring', pHsl);
      document.documentElement.style.setProperty('--sidebar-accent', pHsl);
    }

    if (aHsl) {
      document.documentElement.style.setProperty('--accent', aHsl);
      document.documentElement.style.setProperty('--sidebar-primary', aHsl);
    }

    if (primaryColor || accentColor) {
      const pCss = toValidCssColor(primaryColor, 'hsl(262 83% 45%)');
      const aCss = toValidCssColor(accentColor, 'hsl(330 81% 56%)');
      document.documentElement.style.setProperty('--gradient-hero', `linear-gradient(135deg, ${pCss} 0%, ${aCss} 100%)`);
    }
  }, [settings]);

  return null;
}
