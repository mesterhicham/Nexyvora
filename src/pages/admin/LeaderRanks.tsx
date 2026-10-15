import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { adminAffiliateService } from '@/services/apiService';
import { Award, Crown, Shield, Gem, User, Edit, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function LeaderRanks() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [ranks, setRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingRank, setEditingRank] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    min_direct_sales: 0,
    min_team_turnover: 0,
    reward_amount: 0,
    unlocked_generations: 0,
    color_hex: '#6366f1',
    badge_icon: 'award',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRanks();
  }, []);

  const loadRanks = async () => {
    try {
      setLoading(true);
      const res = await adminAffiliateService.getRanks();
      setRanks(res.ranks || []);
    } catch (err: any) {
      toast.error(tr("فشل تحميل الرتب القيادية", "Failed to load leader ranks"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (rank: any) => {
    setEditingRank(rank);
    setFormData({
      name: rank.name,
      name_ar: rank.name_ar,
      min_direct_sales: Number(rank.min_direct_sales),
      min_team_turnover: Number(rank.min_team_turnover),
      reward_amount: Number(rank.reward_bonus !== undefined ? rank.reward_bonus : (rank.reward_amount || 0)),
      unlocked_generations: Number(rank.unlocked_generations || 0),
      color_hex: rank.color_hex || '#6366f1',
      badge_icon: rank.badge_icon || 'award',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRank) return;

    try {
      setSaving(true);
      await adminAffiliateService.updateRank(editingRank.id, formData);
      toast.success(tr("تم تحديث شروط ومكافأة الرتبة بنجاح", "Rank criteria and reward updated successfully"));
      setEditingRank(null);
      loadRanks();
    } catch (err: any) {
      toast.error(tr("فشل تحديث الرتبة", "Failed to update rank"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-1">
              Leadership System
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {tr("إعدادات الرتب القيادية", "Leader Ranks Configuration")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tr("تحديد سلم الرتب القيادية، شروط المبيعات المباشرة ومبيعات الفريق، والمكافآت المالية المرصودة لكل رتبة.", "Configure leader ranks ladder, direct and team turnover criteria, and monetary rewards for each rank.")}
            </p>
          </div>
        </div>

        {/* Ranks Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-20 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
              {tr("جاري تحميل الرتب...", "Loading ranks...")}
            </div>
          ) : (
            ranks.map((r) => (
              <Card 
                key={r.id} 
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="p-3 rounded-2xl text-white font-bold text-xs flex items-center gap-2"
                      style={{ backgroundColor: r.color_hex || '#6366f1' }}
                    >
                      <Award className="h-5 w-5" />
                      <span>{tr("المستوى ${r.level}", "Level ${r.level}")}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(r)}
                      className="rounded-xl text-xs gap-1 text-slate-500 hover:text-indigo-600"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      {tr("تعديل", "Edit")}
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      {isRtl ? `${r.name_ar} (${r.name})` : `${r.name} (${r.name_ar})`}
                    </h3>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>{tr("المبيعات المباشرة المطلوبة:", "Direct sales required:")}</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {r.min_direct_sales} {tr("طالب", "students")}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>{tr("حجم مبيعات الفريق المطلوب:", "Team turnover required:")}</span>
                      <strong className="text-slate-800 dark:text-slate-200">${Number(r.min_team_turnover).toLocaleString()} USD</strong>
                    </div>
                    <div className="flex items-center justify-between text-indigo-600 font-bold pt-1 border-t border-dashed">
                      <span>{tr("الأجيال المفتوحة:", "Unlocked Generations:")}</span>
                      <span className="font-mono text-sm">
                        {Number(r.unlocked_generations) === 0 
                          ? (tr("المباشر فقط", "Direct Only")) 
                          : Number(r.unlocked_generations) === 10 
                          ? (tr("جميع الأجيال (1-10)", "All Generations (1-10)")) 
                          : (tr("حتى الجيل ${r.unlocked_generations}", "Up to Gen ${r.unlocked_generations}"))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-600 font-bold pt-1">
                      <span>{tr("المكافأة النقدية للرتبة:", "Rank Cash Reward:")}</span>
                      <span className="font-mono text-sm">${Number(r.reward_bonus !== undefined ? r.reward_bonus : (r.reward_amount || 0)).toLocaleString()} USD</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Edit Rank Modal */}
        <Dialog open={Boolean(editingRank)} onOpenChange={(open) => !open && setEditingRank(null)}>
          <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6">
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  {tr("تعديل الرتبة القيادية: ${editingRank?.name_ar}", "Edit Leader Rank: ${editingRank?.name}")}
                </DialogTitle>
                <DialogDescription>
                  {tr("المستوى ${editingRank?.level} في سلم القيادة", "Level ${editingRank?.level} in leadership ladder")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{tr("الاسم بالعربية", "Arabic Name")}</Label>
                    <Input
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      className="rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{tr("الاسم بالإنجليزية", "English Name")}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="rounded-xl text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">{tr("المبيعات المباشرة المطلوبة (عدد الطلاب)", "Required Direct Sales (Students)")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.min_direct_sales}
                    onChange={(e) => setFormData({ ...formData, min_direct_sales: Number(e.target.value) })}
                    className="rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">{tr("حجم مبيعات الفريق التراكمي ($ USD)", "Cumulative Team Turnover ($ USD)")}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.min_team_turnover}
                    onChange={(e) => setFormData({ ...formData, min_team_turnover: Number(e.target.value) })}
                    className="rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-indigo-600 font-bold">{tr("الأجيال المفتوحة بواسطة هذه الرتبة (0 إلى 10)", "Generations Unlocked by Rank (0 to 10)")}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.unlocked_generations}
                    onChange={(e) => setFormData({ ...formData, unlocked_generations: Number(e.target.value) })}
                    className="rounded-xl text-xs font-mono font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-emerald-600 font-bold">{tr("المكافأة النقدية الفورية ($ USD)", "Instant Cash Reward ($ USD)")}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.reward_amount}
                    onChange={(e) => setFormData({ ...formData, reward_amount: Number(e.target.value) })}
                    className="rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">{tr("لون الشارة المميز (Hex Code)", "Badge Accent Color (Hex Code)")}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color_hex}
                      onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                      className="h-8 w-12 rounded cursor-pointer border"
                    />
                    <Input
                      value={formData.color_hex}
                      onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                      className="rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setEditingRank(null)} className="rounded-xl">
                  {tr("إلغاء", "Cancel")}
                </Button>
                <Button type="submit" disabled={saving} className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (tr("حفظ التعديلات", "Save Changes"))}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
