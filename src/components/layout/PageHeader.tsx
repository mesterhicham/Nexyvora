import { ChevronRight, Home, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  icon?: LucideIcon;
}

export function PageHeader({ title, description, breadcrumbs, actions, icon: Icon }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="text-xs text-slate-400 flex items-center gap-1.5 mb-3">
          <Link to="/" className="hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" />
          </Link>
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 rtl:rotate-180" />
              {item.href ? (
                <Link to={item.href} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-600 dark:text-slate-300 font-medium">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {Icon && (
            <div className="p-3 rounded-2xl bg-purple-100/80 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 shrink-0 shadow-xs">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
