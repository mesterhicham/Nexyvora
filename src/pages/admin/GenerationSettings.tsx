import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { adminAffiliateService } from '@/services/apiService';
import { Sliders, Save, Loader2, Sparkles, DollarSign, Percent, Info, Trophy, Layers } from 'lucide-react';
import { toast } from 'sonner';

export default function GenerationSettings() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    directRate: 10,
    gen1Rate: 5,
    gen2Rate: 4,
    gen3Rate: 3,
    gen4Rate: 2,
    gen5Rate: 1,
    gen6Rate: 1,
    gen7Rate: 1,
    gen8Rate: 0.5,
    gen9Rate: 0.5,
    gen10Rate: 0.5,
    calcMode: 'matching_bonus',
    registrationFee: 30,
    registrationSponsorBonus: 15,
    requirePackPurchase: true,
    minWithdrawal: 50,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await adminAffiliateService.getGenerationSettings();
      const s = res.settings || {};
      setForm({
        directRate: Number(s.affiliate_direct_rate ?? 10),
        gen1Rate: Number(s.affiliate_gen1_rate ?? 5),
        gen2Rate: Number(s.affiliate_gen2_rate ?? 4),
        gen3Rate: Number(s.affiliate_gen3_rate ?? 3),
        gen4Rate: Number(s.affiliate_gen4_rate ?? 2),
        gen5Rate: Number(s.affiliate_gen5_rate ?? 1),
        gen6Rate: Number(s.affiliate_gen6_rate ?? 1),
        gen7Rate: Number(s.affiliate_gen7_rate ?? 1),
        gen8Rate: Number(s.affiliate_gen8_rate ?? 0.5),
        gen9Rate: Number(s.affiliate_gen9_rate ?? 0.5),
        gen10Rate: Number(s.affiliate_gen10_rate ?? 0.5),
        calcMode: s.affiliate_calc_mode || 'matching_bonus',
        registrationFee: Number(s.affiliate_registration_fee ?? 30),
        registrationSponsorBonus: Number(s.affiliate_registration_sponsor_bonus ?? 15),
        requirePackPurchase: s.affiliate_require_pack_purchase !== '0',
        minWithdrawal: Number(s.affiliate_min_withdrawal ?? 50),
      });
    } catch (err: any) {
      toast.error(t('generationSettings.loadError', 'Failed to load generation settings'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminAffiliateService.updateGenerationSettings(form);
      toast.success(t('generationSettings.saveSuccess', 'Commission and generation settings saved successfully!'));
    } catch (err: any) {
      const msg = err?.response?.data?.error || t('generationSettings.saveFailed', 'Failed to save generation settings');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Total matching bonus percentages across 10 generations
  const totalMatchingRate = form.gen1Rate + form.gen2Rate + form.gen3Rate + form.gen4Rate + form.gen5Rate + form.gen6Rate + form.gen7Rate + form.gen8Rate + form.gen9Rate + form.gen10Rate;
  
  // Total platform payout as % of package price: directRate + (totalMatchingRate % of directRate)
  const totalEffectivePayoutPct = Number((form.directRate + (form.directRate * totalMatchingRate) / 100).toFixed(2));
  const platformMarginPct = Number((100 - totalEffectivePayoutPct).toFixed(2));

  const gens = [
    { num: 1, key: 'gen1Rate', color: 'text-blue-600', val: form.gen1Rate, sample: '$2.50' },
    { num: 2, key: 'gen2Rate', color: 'text-cyan-600', val: form.gen2Rate, sample: '$2.00' },
    { num: 3, key: 'gen3Rate', color: 'text-emerald-600', val: form.gen3Rate, sample: '$1.50' },
    { num: 4, key: 'gen4Rate', color: 'text-amber-600', val: form.gen4Rate, sample: '$1.00' },
    { num: 5, key: 'gen5Rate', color: 'text-orange-600', val: form.gen5Rate, sample: '$0.50' },
    { num: 6, key: 'gen6Rate', color: 'text-purple-600', val: form.gen6Rate, sample: '$0.50' },
    { num: 7, key: 'gen7Rate', color: 'text-pink-600', val: form.gen7Rate, sample: '$0.50' },
    { num: 8, key: 'gen8Rate', color: 'text-rose-600', val: form.gen8Rate, sample: '$0.25' },
    { num: 9, key: 'gen9Rate', color: 'text-indigo-600', val: form.gen9Rate, sample: '$0.25' },
    { num: 10, key: 'gen10Rate', color: 'text-violet-600', val: form.gen10Rate, sample: '$0.25' },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-12 max-w-5xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider mb-1">
            {t('generationSettings.algorithmBadge', 'Matching Bonus Algorithm')}
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {t('generationSettings.title', 'Affiliate Generation & Matching Bonus Settings')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('generationSettings.subtitle', 'Configure 10-tier matching bonus rates, registration fees, sponsor bonuses, and minimum withdrawal limits.')}
          </p>
        </div>

        {/* Financial Sustainability Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-200 dark:border-indigo-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('generationSettings.sustainabilityTitle', 'Financial Sustainability Algorithm (Matching Bonus Engine)')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('generationSettings.sustainabilityDesc', 'Generation commissions are calculated as a percentage of the direct commission ({{directRate}}%) only. Total commission payout is {{payout}}% and the platform net margin is {{margin}}%.', {
                  directRate: form.directRate,
                  payout: totalEffectivePayoutPct,
                  margin: platformMarginPct
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 font-bold block">{t('generationSettings.totalMatching', 'Total Matching')}</span>
              <span className="text-base font-black text-purple-600">{totalMatchingRate}%</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
              <span className="text-[10px] text-emerald-600 font-bold block">{t('generationSettings.platformNetMargin', 'Platform Net Margin')}</span>
              <span className="text-base font-black text-emerald-600">{platformMarginPct}%</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Direct Commissions & Registration Fee Card */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg font-bold">
                {t('generationSettings.directAndRegTitle', '1. Direct Package Commission & Community Membership ($30)')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('generationSettings.directAndRegDesc', 'Configure direct package sales commission and community membership onboarding fee.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Direct Package Rate */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('generationSettings.directPackageCommission', 'Direct Package Commission')}
                    </Label>
                    <span className="text-[10px] text-slate-400 font-semibold">{t('generationSettings.forDirectReferrer', 'For direct inviter')}</span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      step="0.5"
                      value={form.directRate}
                      onChange={(e) => setForm({ ...form, directRate: Number(e.target.value) })}
                      className="rounded-xl text-sm font-black pr-8"
                    />
                    <span className="absolute right-3 top-2.5 font-bold text-xs text-slate-400">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400">$50 of $500 pack</p>
                </div>

                {/* Registration Fee */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('generationSettings.communityMembershipFee', 'Community Membership Fee')}
                    </Label>
                    <span className="text-[10px] text-slate-400 font-semibold">{t('generationSettings.onboardingSubscription', 'Registration Fee')}</span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={form.registrationFee}
                      onChange={(e) => setForm({ ...form, registrationFee: Number(e.target.value) })}
                      className="rounded-xl text-sm font-black pl-8"
                    />
                    <span className="absolute left-3 top-2.5 font-bold text-xs text-slate-400">$</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{t('generationSettings.oneTimeFee', 'One-time fee ($30)')}</p>
                </div>

                {/* Registration Sponsor Bonus */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('generationSettings.sponsorBonusFromReg', 'Sponsor Bonus from Registration')}
                    </Label>
                    <span className="text-[10px] text-emerald-600 font-semibold">{t('generationSettings.direct50Pct', '50% Direct')}</span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={form.registrationSponsorBonus}
                      onChange={(e) => setForm({ ...form, registrationSponsorBonus: Number(e.target.value) })}
                      className="rounded-xl text-sm font-black pl-8"
                    />
                    <span className="absolute left-3 top-2.5 font-bold text-xs text-slate-400">$</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{t('generationSettings.paidInstantlyToSponsor', 'Paid immediately to sponsor ($15)')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 10 Generations Matching Bonus Rates Card */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    {t('generationSettings.matchingRatesCardTitle', '2. 10 Generations Matching Bonus Rates')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t('generationSettings.matchingRatesCardDesc', 'These rates are calculated as a Matching Bonus from the direct commission value ({{directRate}}%) only.', { directRate: form.directRate })}
                  </CardDescription>
                </div>
                <div className="px-3.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 text-xs font-black border border-purple-200">
                  {t('generationSettings.totalMatching', 'Total Matching')}: {totalMatchingRate}%
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 space-y-4 pt-2">
              {/* Generation Packages vs Ranks Notice */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
                <p><strong>{t('generationSettings.unlockRulesTitle', 'Unlock Criteria:')}</strong></p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div>📦 {t('generationSettings.packagesRule', 'Packages: FLOW $150 (G1) • GROW $500 (G1+G2) • PRIME $1000 (G1+G2+G3)')}</div>
                  <div>🏆 {t('generationSettings.ranksRule', 'Leadership Ranks: Rank 1 (G1..2) • Rank 2 (G1..3) • Rank 3 (G1..4) • Rank 4 (G1..6) • Rank 5 (G1..10)')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                {gens.map((g) => (
                  <div key={g.num} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold">{t('generationSettings.generationLabel', 'Generation {{num}}', { num: g.num })}</Label>
                      <span className={`text-[10px] font-bold ${g.color}`}>G{g.num}</span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={g.val}
                        onChange={(e) => setForm({ ...form, [g.key]: Number(e.target.value) })}
                        className="rounded-xl text-sm font-black pr-7"
                      />
                      <span className="absolute right-2.5 top-2.5 font-bold text-xs text-slate-400">%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">{g.sample} of $50</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Eligibility & Minimum Withdrawal Card */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-bold">
                {t('generationSettings.eligibilityCardTitle', '3. Eligibility & Minimum Withdrawal')}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 space-y-6">
              {/* Eligibility Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {t('generationSettings.requirePackageTitle', 'Require Prior Package Purchase for Commission Eligibility')}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t('generationSettings.requirePackageDesc', 'When enabled, members only receive team generation commissions if they have purchased an educational package.')}
                  </p>
                </div>
                <Switch
                  checked={form.requirePackPurchase}
                  onCheckedChange={(checked) => setForm({ ...form, requirePackPurchase: checked })}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>

              {/* Minimum Withdrawal */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t('generationSettings.minWithdrawalLabel', 'Minimum Withdrawal Request Amount ($ USD)')}
                </Label>
                <div className="relative max-w-xs">
                  <Input
                    type="number"
                    min="1"
                    step="5"
                    value={form.minWithdrawal}
                    onChange={(e) => setForm({ ...form, minWithdrawal: Number(e.target.value) })}
                    className="rounded-xl text-sm font-black pl-8"
                  />
                  <span className="absolute left-3 top-2.5 font-bold text-xs text-slate-400">$</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {t('generationSettings.minWithdrawalHelper', 'Minimum wallet balance required for students to submit a withdrawal request.')}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving || loading}
              className="rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 px-8 py-6 text-sm shadow-lg shadow-indigo-500/20"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('generationSettings.saveAllSettings', 'Save All Settings')}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
