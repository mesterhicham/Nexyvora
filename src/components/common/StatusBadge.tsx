import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, AlertCircle, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const variantStyles = {
  default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  success: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-900/60',
  warning: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/70 dark:border-amber-900/60',
  error: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/70 dark:border-rose-900/60',
  info: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-200/70 dark:border-purple-900/60',
};

const variantIcons = {
  default: null,
  success: CheckCircle2,
  warning: Clock,
  error: XCircle,
  info: Sparkles,
};

export function StatusBadge({ status, variant = 'default', className }: StatusBadgeProps) {
  const Icon = variantIcons[variant];

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize border shadow-2xs transition-colors",
      variantStyles[variant],
      className
    )}>
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{status}</span>
    </span>
  );
}

export function getStatusVariant(status: string): StatusBadgeProps['variant'] {
  switch (status.toLowerCase()) {
    case 'active':
    case 'present':
    case 'completed':
    case 'issued':
    case 'valid':
    case 'signed':
    case 'approved':
      return 'success';
    case 'pending':
    case 'upcoming':
    case 'late':
    case 'scheduled':
    case 'in_progress':
      return 'warning';
    case 'inactive':
    case 'absent':
    case 'suspended':
    case 'cancelled':
    case 'closed':
    case 'invalid':
    case 'rejected':
      return 'error';
    case 'graduated':
      return 'info';
    default:
      return 'default';
  }
}
