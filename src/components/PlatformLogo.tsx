import { useState } from 'react';
import { usePlatformSettings } from '@/hooks/useAdminFeatures';
import { cn } from '@/lib/utils';

export interface PlatformLogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  iconClassName?: string;
  showText?: boolean;
  variant?: 'auto' | 'icon' | 'full';
  useFullLogo?: boolean;
}

export function PlatformLogo({
  className = "flex items-center gap-2.5",
  imageClassName,
  textClassName = "text-xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-amber-500 dark:from-violet-400 dark:via-purple-300 dark:to-amber-400 bg-clip-text text-transparent tracking-tight",
  iconClassName,
  showText = true,
  variant = 'auto',
  useFullLogo = false,
}: PlatformLogoProps) {
  const { data: settings } = usePlatformSettings();
  const [imageError, setImageError] = useState(false);

  const customLogoUrl = settings?.map?.['logo_url']?.value;
  const platformName = settings?.map?.['platform_name']?.value || 'Nexyvora';

  // Determine effective display mode:
  // 'full' if useFullLogo is true or variant is 'full'
  // If customLogoUrl exists and variant is 'auto', treat as full logo unless showText is explicitly requested with an icon variant
  const isFullVariant = useFullLogo || variant === 'full';

  // 1. FULL HORIZONTAL LOGO MODE (No duplicate text, clean responsive presentation)
  if (isFullVariant && !imageError) {
    if (customLogoUrl) {
      return (
        <div className={cn("flex items-center", className)}>
          <img
            src={customLogoUrl}
            alt={platformName}
            className={cn("h-9 w-auto max-w-[220px] object-contain", imageClassName)}
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    return (
      <div className={cn("flex items-center", className)}>
        {/* Light Mode Full Logo */}
        <img
          src="/logo-light.png"
          alt={platformName}
          className={cn("dark:hidden h-9 w-auto max-w-[220px] object-contain", imageClassName)}
          onError={() => setImageError(true)}
        />
        {/* Dark Mode Full Logo */}
        <img
          src="/logo-dark.png"
          alt={platformName}
          className={cn("hidden dark:block h-9 w-auto max-w-[220px] object-contain", imageClassName)}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // 2. CUSTOM UPLOADED LOGO (If admin set a custom logo URL and variant is auto)
  if (customLogoUrl && variant === 'auto' && !imageError) {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <img
          src={customLogoUrl}
          alt={platformName}
          className={cn("h-8 max-w-[180px] object-contain", imageClassName)}
          onError={() => setImageError(true)}
        />
        {/* Only show text if explicitly requested */}
        {showText && !useFullLogo && (
          <span className={cn(textClassName)}>{platformName}</span>
        )}
      </div>
    );
  }

  // 3. ICON + BRAND NAME MODE (Official 3D "N" Ribbon Emblem + Typography)
  return (
    <div className={cn("flex items-center gap-2.5 shrink-0", className)}>
      <img
        src="/logo-icon.png"
        alt={platformName}
        className={cn(
          "h-8 w-8 object-contain shrink-0 drop-shadow-xs transition-transform duration-300 hover:scale-105",
          imageClassName,
          iconClassName
        )}
        onError={(e) => {
          // Fallback to PWA icon
          (e.target as HTMLImageElement).src = '/icons/icon-192x192.png';
        }}
      />
      {showText && (
        <span className={cn("select-none", textClassName)}>
          {platformName}
        </span>
      )}
    </div>
  );
}
