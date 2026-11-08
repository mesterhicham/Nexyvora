import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ImgHTMLAttributes, MouseEvent } from 'react';
import { isSecureFileUrl, openSecureFile, safeUrl, useSecureFileUrl } from '@/lib/secureFiles';

/** Drop-in replacement for <img> that also displays private uploads. */
export const SecureImage = forwardRef<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>>(
  ({ src, alt, ...props }, ref) => {
    const { src: resolved, loading, error } = useSecureFileUrl(src);
    if (loading) {
      return <span className="inline-block h-24 w-full animate-pulse rounded-lg bg-slate-200/60 dark:bg-slate-800/60" aria-busy="true" />;
    }
    if (error || !resolved) {
      return <span className="text-xs text-slate-400">{alt || 'File unavailable'}</span>;
    }
    return <img ref={ref} src={resolved} alt={alt} {...props} />;
  }
);
SecureImage.displayName = 'SecureImage';

/** Drop-in replacement for <a> on user-supplied links. */
export const SecureLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ href, onClick, children, target, rel, ...props }, ref) => {
    const secure = isSecureFileUrl(href);
    const safeHref = secure ? '#' : safeUrl(href);

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      if (secure) {
        e.preventDefault();
        openSecureFile(href);
      } else if (!safeHref) {
        e.preventDefault();
      }
    };

    return (
      <a
        ref={ref}
        href={safeHref}
        target={secure ? undefined : target}
        rel={target === '_blank' ? rel || 'noopener noreferrer' : rel}
        onClick={handleClick}
        {...props}
      >
        {children}
      </a>
    );
  }
);
SecureLink.displayName = 'SecureLink';
