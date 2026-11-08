import { Award, Loader2, Lock } from 'lucide-react';
import { tr } from '@/utils/tr';
import { Button } from '@/components/ui/button';

interface CourseProgressCardProps {
  isCompleted: boolean;
  remaining: number;
  claiming?: boolean;
  onClaim: () => void;
}

/** Certificate status: locked until every lesson is completed (the server confirms on claim). */
export function CourseProgressCard({ isCompleted, remaining, claiming, onClaim }: CourseProgressCardProps) {
  if (isCompleted) {
    return (
      <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-300">
          <Award className="h-5 w-5 text-amber-500" />
          {tr('تهانينا! أتممت الدورة', 'Congratulations! Course completed')}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {tr('يمكنك الآن الحصول على شهادة إتمام الدورة المعتمدة من Nexyvora.', 'You can now claim your Nexyvora course completion certificate.')}
        </p>
        <Button onClick={onClaim} disabled={claiming} className="w-full gap-2 bg-emerald-600 font-bold text-white hover:bg-emerald-700">
          {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
          {tr('الحصول على الشهادة', 'Claim certificate')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
      <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="space-y-1">
        <p className="text-sm font-black text-amber-800 dark:text-amber-300">{tr('حالة الشهادة: مقفلة', 'Certificate Status: Locked')}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {tr(
            `تحصل على الشهادة بعد إكمال جميع الدروس (متبقي ${remaining} ${remaining === 1 ? 'درس' : 'دروس'}).`,
            `You can only obtain the certificate after completing all lessons (${remaining} lesson${remaining === 1 ? '' : 's'} remaining).`
          )}
        </p>
      </div>
    </div>
  );
}
