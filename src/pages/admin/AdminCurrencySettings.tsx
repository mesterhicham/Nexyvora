import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { currencyService } from '@/services/apiService';
import { 
  Globe, 
  Coins, 
  History, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  Search,
  Building2,
  CreditCard,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Landmark
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCurrencySettings() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [rules, setRules] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCountry, setSavingCountry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add Country Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCountry, setNewCountry] = useState({
    country_code: '',
    country_name: '',
    country_name_ar: '',
    currency_code: '',
    currency_symbol: '',
    usd_rate: '1.0',
    usdt_rate: '1.0',
    usdt_enabled: true,
    bank_transfer_enabled: true,
    stripe_enabled: false,
    paypal_enabled: false,
    payoneer_enabled: false,
    bank_name: '',
    account_holder: '',
    account_number: '',
    iban: '',
    swift_code: '',
    bank_instructions_ar: ''
  });
  const [addingSubmitting, setAddingSubmitting] = useState(false);
  const [expandedBankCountry, setExpandedBankCountry] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [rulesRes, logsRes] = await Promise.all([
        currencyService.getAdminRules(),
        currencyService.getAdminAuditLogs({ limit: 100 })
      ]);
      setRules(rulesRes.rules || []);
      setAuditLogs(logsRes.auditLogs || []);
    } catch (err: any) {
      console.error(err);
      toast.error(tr("فشل تحميل بيانات العملات", "Failed to load currency settings"));
    } finally {
      setLoading(false);
    }
  };

  const handleRuleChange = (countryCode: string, field: string, value: any) => {
    setRules(prev => prev.map(r => {
      if (r.country_code === countryCode) {
        // Enforce Algeria USDT restriction
        if (countryCode === 'DZ' && field === 'usdt_enabled') {
          return { ...r, [field]: 0 };
        }
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const handleSaveRule = async (rule: any) => {
    try {
      setSavingCountry(rule.country_code);
      await currencyService.updateAdminRule(rule.country_code, {
        country_name: rule.country_name,
        country_name_ar: rule.country_name_ar,
        currency_code: rule.currency_code,
        currency_symbol: rule.currency_symbol,
        usd_rate: parseFloat(rule.usd_rate),
        usdt_rate: parseFloat(rule.usdt_rate),
        usdt_enabled: rule.country_code === 'DZ' ? 0 : (rule.usdt_enabled ? 1 : 0),
        local_currency_enabled: rule.local_currency_enabled ? 1 : 0,
        stripe_enabled: rule.stripe_enabled ? 1 : 0,
        paypal_enabled: rule.paypal_enabled ? 1 : 0,
        payoneer_enabled: rule.payoneer_enabled ? 1 : 0,
        bank_transfer_enabled: rule.bank_transfer_enabled ? 1 : 0,
        is_active: rule.is_active ? 1 : 0,
        bank_name: rule.bank_name || null,
        account_holder: rule.account_holder || null,
        account_number: rule.account_number || null,
        iban: rule.iban || null,
        swift_code: rule.swift_code || null,
        bank_instructions: rule.bank_instructions || null,
        bank_instructions_ar: rule.bank_instructions_ar || null
      });
      toast.success(tr(`تم حفظ إعدادات ${rule.country_name_ar || rule.country_name} بنجاح`, `Updated ${rule.country_name} settings`));
      // Reload logs to show new entry
      const logsRes = await currencyService.getAdminAuditLogs({ limit: 100 });
      setAuditLogs(logsRes.auditLogs || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || (tr("فشل حفظ الإعدادات", "Failed to save settings")));
    } finally {
      setSavingCountry(null);
    }
  };

  const handleCreateCountry = async () => {
    if (!newCountry.country_code || !newCountry.country_name || !newCountry.currency_code) {
      return toast.error(tr("يرجى ملء جميع الحقول الإلزامية", "Please fill all required fields"));
    }

    try {
      setAddingSubmitting(true);
      await currencyService.createAdminRule({
        ...newCountry,
        country_code: newCountry.country_code.toUpperCase().trim(),
        usd_rate: parseFloat(newCountry.usd_rate) || 1.0,
        usdt_rate: parseFloat(newCountry.usdt_rate) || 1.0,
      });
      toast.success(tr("تمت إضافة الدولة بنجاح", "Country rule added successfully"));
      setIsAddOpen(false);
      setNewCountry({
        country_code: '',
        country_name: '',
        country_name_ar: '',
        currency_code: '',
        currency_symbol: '',
        usd_rate: '1.0',
        usdt_rate: '1.0',
        usdt_enabled: true,
        bank_transfer_enabled: true,
        stripe_enabled: false,
        paypal_enabled: false,
        payoneer_enabled: false,
        bank_name: '',
        account_holder: '',
        account_number: '',
        iban: '',
        swift_code: '',
        bank_instructions_ar: ''
      });
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || (tr("فشلت إضافة الدولة", "Failed to add country")));
    } finally {
      setAddingSubmitting(false);
    }
  };

  const getCountryFlag = (code: string) => {
    switch (code) {
      case 'MA': return '🇲🇦';
      case 'DZ': return '🇩🇿';
      case 'TN': return '🇹🇳';
      case 'AE': return '🇦🇪';
      case 'SA': return '🇸🇦';
      case 'QA': return '🇶🇦';
      case 'KW': return '🇰🇼';
      case 'EG': return '🇪🇬';
      case 'FR': return '🇫🇷';
      case 'US': return '🇺🇸';
      case 'GLOBAL': return '🌍';
      default: return '🌐';
    }
  };

  const filteredRules = rules.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.country_code.toLowerCase().includes(q) ||
      (r.country_name || '').toLowerCase().includes(q) ||
      (r.country_name_ar || '').toLowerCase().includes(q) ||
      (r.currency_code || '').toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Globe className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {tr("إعدادات العملات وطرق الدفع حسب الدولة", "Country Currency & Payment Settings")}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {tr("تحكم ذكي في العملة المعروضة، أسعار الصرف اليدوية، تفعيل USDT، وبوابات الدفع المتاحة لكل دولة مع سجل تدقيق متكامل.", "Manage localized currencies, manual exchange rates, USDT toggles, and payment gateways with a complete audit log.")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAll}
              disabled={loading}
              className="rounded-xl border-slate-200 dark:border-slate-800"
            >
              <RefreshCw className={`h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0 ${loading ? 'animate-spin' : ''}`} />
              {tr("تحديث", "Refresh")}
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20"
            >
              <Plus className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
              {tr("إضافة دولة جديدة", "Add Country Rule")}
            </Button>
          </div>
        </div>

        {/* Informational Callout */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              {tr("ملاحظة محاسبية وأمنية هامة:", "Crucial Accounting & Security Rule:")}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              {tr("العملة الأساسية في قاعدة البيانات وسجلات الأرباح هي دائماً الدولار (USD). تغيير أسعار الصرف هنا يؤثر ديناميكياً فقط على واجهات العرض والشراء دون المساس بأرصدة المستخدمين السابقة. بالنسبة للجزائر (DZ)، تم فرض حظر أمني صارم يمنع إظهار أو استخدام USDT تحت أي ظرف.", "Internal accounting balance is strictly kept in USD. Rate changes here dynamically update display and checkout without altering past records. For Algeria (DZ), USDT is strictly prohibited across frontend and backend.")}
            </p>
          </div>
        </div>

        {/* Tabs: Rules vs Audit Log */}
        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <TabsTrigger value="rules" className="rounded-xl font-bold flex items-center gap-2">
              <Coins className="h-4 w-4" />
              <span>{tr("قواعد العملات وأسعار الصرف", "Currency & Exchange Rules")}</span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{rules.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="audit" className="rounded-xl font-bold flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>{tr("سجل التدقيق (Audit Log)", "Audit Trail")}</span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{auditLogs.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: RULES */}
          <TabsContent value="rules" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={tr("بحث باسم الدولة أو الرمز...", "Search country or code...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rtl:pr-9 rtl:pl-3 rounded-xl border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredRules.map((rule) => {
                const isAlgeria = rule.country_code === 'DZ';
                const isMorocco = rule.country_code === 'MA';
                const isSaving = savingCountry === rule.country_code;

                return (
                  <Card 
                    key={rule.country_code} 
                    className={`rounded-3xl border ${isAlgeria ? 'border-emerald-500/30 bg-emerald-500/5' : isMorocco ? 'border-blue-500/30 bg-blue-500/5' : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'} p-5 sm:p-6 shadow-xs transition-all`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Country Meta */}
                      <div className="flex items-start sm:items-center gap-4 min-w-[240px]">
                        <span className="text-3xl sm:text-4xl">{getCountryFlag(rule.country_code)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                              {isRtl ? (rule.country_name_ar || rule.country_name) : rule.country_name}
                            </h3>
                            <Badge variant="outline" className="font-mono text-xs font-black">
                              {rule.country_code}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {tr("العملة المعروضة:", "Currency:")}{' '}
                            <strong className="text-slate-800 dark:text-slate-200">{rule.currency_code} ({rule.currency_symbol})</strong>
                          </p>
                          {isAlgeria && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>{tr("نظام دينار حصري (حظر تام لـ USDT)", "Strict DZD Only (USDT Blocked)")}</span>
                            </div>
                          )}
                          {isMorocco && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{tr("عرض مزدوج: درهم مغربي + معادل USDT", "Dual Display: MAD + USDT")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rates Controls */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 min-w-[280px]">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-500">
                            1 USD = ({rule.currency_code})
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              value={rule.usd_rate}
                              onChange={(e) => handleRuleChange(rule.country_code, 'usd_rate', e.target.value)}
                              className="font-mono font-bold text-sm h-9 rounded-xl pr-8 rtl:pr-3 rtl:pl-8"
                            />
                            <span className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                              {rule.currency_symbol}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-500">
                            1 USDT = ({rule.currency_code})
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              value={rule.usdt_rate}
                              onChange={(e) => handleRuleChange(rule.country_code, 'usdt_rate', e.target.value)}
                              className="font-mono font-bold text-sm h-9 rounded-xl pr-8 rtl:pr-3 rtl:pl-8"
                            />
                            <span className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                              {rule.currency_symbol}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Toggles: USDT & Gateways */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 lg:gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800">
                        {/* USDT Toggle */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            USDT
                          </span>
                          {isAlgeria ? (
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 text-[10px] font-black" title="ممنوع ومقفل للجزائر">
                              <Lock className="h-3 w-3" />
                              <span>{tr("محظور", "Banned")}</span>
                            </div>
                          ) : (
                            <Switch
                              checked={!!rule.usdt_enabled}
                              onCheckedChange={(checked) => handleRuleChange(rule.country_code, 'usdt_enabled', checked ? 1 : 0)}
                            />
                          )}
                        </div>

                        {/* Bank Transfer Toggle */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {tr("بنك", "Bank")}
                          </span>
                          <Switch
                            checked={!!rule.bank_transfer_enabled}
                            onCheckedChange={(checked) => handleRuleChange(rule.country_code, 'bank_transfer_enabled', checked ? 1 : 0)}
                          />
                        </div>

                        {/* Stripe Toggle */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Stripe
                          </span>
                          <Switch
                            checked={!!rule.stripe_enabled}
                            onCheckedChange={(checked) => handleRuleChange(rule.country_code, 'stripe_enabled', checked ? 1 : 0)}
                          />
                        </div>

                        {/* PayPal Toggle */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            PayPal
                          </span>
                          <Switch
                            checked={!!rule.paypal_enabled}
                            onCheckedChange={(checked) => handleRuleChange(rule.country_code, 'paypal_enabled', checked ? 1 : 0)}
                          />
                        </div>

                        {/* Payoneer Toggle */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Payoneer
                          </span>
                          <Switch
                            checked={!!rule.payoneer_enabled}
                            onCheckedChange={(checked) => handleRuleChange(rule.country_code, 'payoneer_enabled', checked ? 1 : 0)}
                          />
                        </div>

                        {/* Bank Details Toggle Button */}
                        <div className="w-full sm:w-auto flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExpandedBankCountry(expandedBankCountry === rule.country_code ? null : rule.country_code)}
                            className="rounded-xl border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/50"
                          >
                            <Landmark className="h-3.5 w-3.5 mr-1 rtl:ml-1 rtl:mr-0 text-blue-600" />
                            {tr("بيانات البنك المحلي", "Local Bank Info")}
                            {expandedBankCountry === rule.country_code ? (
                              <ChevronUp className="h-3.5 w-3.5 ml-1 rtl:mr-1 rtl:ml-0" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 ml-1 rtl:mr-1 rtl:ml-0" />
                            )}
                          </Button>
                        </div>

                        {/* Save Action */}
                        <div className="w-full sm:w-auto flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleSaveRule(rule)}
                            disabled={isSaving}
                            className="rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold hover:scale-102 active:scale-98 transition-all"
                          >
                            <Save className={`h-3.5 w-3.5 mr-1 rtl:ml-1 rtl:mr-0 ${isSaving ? 'animate-spin' : ''}`} />
                            {isSaving ? (tr("جاري الحفظ...", "Saving...")) : (tr("حفظ", "Save"))}
                          </Button>
                        </div>
                      </div>

                    </div>

                    {/* Expandable Country Bank Details Panel */}
                    {expandedBankCountry === rule.country_code && (
                      <div className="mt-5 pt-5 border-t border-slate-200/80 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              <Landmark className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                              {`${tr("بيانات الحساب البنكي والتحويل اليدوي", "Local Bank & Manual Payment Details")} (${isRtl ? (rule.country_name_ar || rule.country_name) : rule.country_name})`}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200">
                            {tr("يظهر لمستخدمي هذه الدولة عند الإيداع", "Shown to students of this country")}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-500">
                              {tr("اسم البنك / جهة الدفع", "Bank / Institution Name")}
                            </Label>
                            <Input
                              placeholder={tr("مثال: بنك المغرب، بريدي موب، الإمارات دبي الوطني", "e.g. Attijariwafa Bank, BaridiMob, Emirates NBD")}
                              value={rule.bank_name || ''}
                              onChange={(e) => handleRuleChange(rule.country_code, 'bank_name', e.target.value)}
                              className="text-xs h-9 rounded-xl font-medium"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-500">
                              {tr("اسم صاحب الحساب (المستفيد)", "Account Holder / Beneficiary Name")}
                            </Label>
                            <Input
                              placeholder="e.g. Nextvora Academy LLC"
                              value={rule.account_holder || ''}
                              onChange={(e) => handleRuleChange(rule.country_code, 'account_holder', e.target.value)}
                              className="text-xs h-9 rounded-xl font-medium"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-500">
                              {tr("رقم الحساب / RIB / RIP", "Account Number / RIB / RIP")}
                            </Label>
                            <Input
                              placeholder="001 00600 0001234567 89"
                              value={rule.account_number || ''}
                              onChange={(e) => handleRuleChange(rule.country_code, 'account_number', e.target.value)}
                              className="text-xs h-9 rounded-xl font-mono font-medium"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-500">
                              {tr("رقم الآيبان الدولي (IBAN)", "IBAN")}
                            </Label>
                            <Input
                              placeholder="MA64 0077... or AE07 0260..."
                              value={rule.iban || ''}
                              onChange={(e) => handleRuleChange(rule.country_code, 'iban', e.target.value)}
                              className="text-xs h-9 rounded-xl font-mono font-medium"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-500">
                              {tr("كود السويفت (SWIFT / BIC)", "SWIFT / BIC Code")}
                            </Label>
                            <Input
                              placeholder="e.g. BCMAMAMC, BNALFZAL, EBILAEAD"
                              value={rule.swift_code || ''}
                              onChange={(e) => handleRuleChange(rule.country_code, 'swift_code', e.target.value)}
                              className="text-xs h-9 rounded-xl font-mono uppercase font-medium"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                            <Label className="text-[11px] font-bold text-slate-500">
                              {tr("تعليمات التحويل للعميل (بالعربية)", "Payment Instructions (Arabic)")}
                            </Label>
                            <Input
                              placeholder={tr("يرجى التحويل بالعملة المحلية وإرفاق الوصل...", "Transfer in local currency and attach receipt...")}
                              value={rule.bank_instructions_ar || ''}
                              onChange={(e) => handleRuleChange(rule.country_code, 'bank_instructions_ar', e.target.value)}
                              className="text-xs h-9 rounded-xl font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 2: AUDIT LOG */}
          <TabsContent value="audit" className="space-y-4">
            <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {tr("سجل تدقيق تعديلات العملات وأسعار الصرف", "Currency & Payment Audit Trail")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {tr("توثيق كامل لكافة التعديلات الإدارية المتضمنة المسؤول، الحقل المعدل، القيمة القديمة والجديدة، والتاريخ وعنوان IP.", "Immutable trail of administrative updates with old vs new values, admin identity, and IP address.")}
                  </p>
                </div>
              </div>

              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  {tr("لا توجد سجلات تدقيق حتى الآن.", "No audit entries yet.")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left rtl:text-right">
                    <thead className="text-[11px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <tr>
                        <th className="p-3">{tr("التاريخ والوقت", "Date & Time")}</th>
                        <th className="p-3">{tr("الأدمن", "Admin")}</th>
                        <th className="p-3">{tr("الدولة", "Country")}</th>
                        <th className="p-3">{tr("الحقل", "Field")}</th>
                        <th className="p-3">{tr("القيمة السابقة", "Old Value")}</th>
                        <th className="p-3">{tr("القيمة الجديدة", "New Value")}</th>
                        <th className="p-3">{tr("عنوان IP", "IP Address")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                            {log.admin_email}
                          </td>
                          <td className="p-3 font-mono font-black text-blue-600">
                            {log.country_code}
                          </td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                            {log.field_name}
                          </td>
                          <td className="p-3 font-mono text-rose-500 line-through">
                            {log.old_value || '—'}
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-600">
                            {log.new_value || '—'}
                          </td>
                          <td className="p-3 font-mono text-slate-400 text-[11px]">
                            {log.ip_address || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal: Add Country Rule */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-lg rounded-3xl p-6">
            <DialogHeader className={isRtl ? 'text-right' : 'text-left'}>
              <DialogTitle className="text-xl font-black">
                {tr("إضافة قاعدة عملة لدولة جديدة", "Add New Country Currency Rule")}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {tr("أدخل بيانات الدولة وكود العملة وسعر الصرف المقابل للدولار الأمريكي.", "Define country ISO code, local currency, and exchange rate to USD.")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold">{tr("كود الدولة (ISO)", "Country Code (ISO)")}</Label>
                <Input
                  placeholder="e.g. AE, SA, EG"
                  maxLength={5}
                  value={newCountry.country_code}
                  onChange={(e) => setNewCountry({ ...newCountry, country_code: e.target.value.toUpperCase() })}
                  className="rounded-xl font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">{tr("اسم الدولة بالإنجليزية", "Country Name (EN)")}</Label>
                <Input
                  placeholder="e.g. United Arab Emirates"
                  value={newCountry.country_name}
                  onChange={(e) => setNewCountry({ ...newCountry, country_name: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">{tr("اسم الدولة بالعربية", "Country Name (AR)")}</Label>
                <Input
                  placeholder="مثال: الإمارات العربية المتحدة"
                  value={newCountry.country_name_ar}
                  onChange={(e) => setNewCountry({ ...newCountry, country_name_ar: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">{tr("كود العملة (ISO)", "Currency Code")}</Label>
                <Input
                  placeholder="e.g. AED, SAR, EGP"
                  maxLength={5}
                  value={newCountry.currency_code}
                  onChange={(e) => setNewCountry({ ...newCountry, currency_code: e.target.value.toUpperCase() })}
                  className="rounded-xl font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">{tr("رمز العملة", "Currency Symbol")}</Label>
                <Input
                  placeholder="e.g. د.إ, ر.س, ج.م"
                  value={newCountry.currency_symbol}
                  onChange={(e) => setNewCountry({ ...newCountry, currency_symbol: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">{tr("سعر صرف USD", "1 USD Rate")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newCountry.usd_rate}
                  onChange={(e) => setNewCountry({ ...newCountry, usd_rate: e.target.value })}
                  className="rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">{tr("سعر صرف USDT", "1 USDT Rate")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newCountry.usdt_rate}
                  onChange={(e) => setNewCountry({ ...newCountry, usdt_rate: e.target.value })}
                  className="rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-between col-span-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 mt-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold">{tr("تفعيل USDT لهذه الدولة", "Enable USDT for this country")}</span>
                  <p className="text-[10px] text-slate-400">{tr("إمكانية الإيداع والسحب والشراء بـ USDT", "Allow deposits & purchases via USDT")}</p>
                </div>
                <Switch
                  checked={newCountry.usdt_enabled}
                  onCheckedChange={(checked) => setNewCountry({ ...newCountry, usdt_enabled: checked })}
                />
              </div>

              {/* Local Bank Details for New Country */}
              <div className="col-span-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                  <Landmark className="h-4 w-4 text-blue-600" />
                  {tr("بيانات البنك والتحويل المحلي (اختياري)", "Local Bank Details (Optional)")}
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500">{tr("اسم البنك", "Bank Name")}</Label>
                    <Input
                      placeholder={tr("مثال: التجاري وفا بنك، بريدي موب", "e.g. Emirates NBD, Attijariwafa")}
                      value={newCountry.bank_name}
                      onChange={(e) => setNewCountry({ ...newCountry, bank_name: e.target.value })}
                      className="text-xs h-8 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500">{tr("اسم صاحب الحساب", "Account Holder")}</Label>
                    <Input
                      placeholder="e.g. Nextvora LLC"
                      value={newCountry.account_holder}
                      onChange={(e) => setNewCountry({ ...newCountry, account_holder: e.target.value })}
                      className="text-xs h-8 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500">{tr("رقم الحساب / RIP", "Account Number / RIP")}</Label>
                    <Input
                      placeholder="001 002 0001234567 89"
                      value={newCountry.account_number}
                      onChange={(e) => setNewCountry({ ...newCountry, account_number: e.target.value })}
                      className="text-xs h-8 rounded-lg font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500">{tr("رقم الآيبان (IBAN)", "IBAN")}</Label>
                    <Input
                      placeholder="AE07 0260..."
                      value={newCountry.iban}
                      onChange={(e) => setNewCountry({ ...newCountry, iban: e.target.value })}
                      className="text-xs h-8 rounded-lg font-mono"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500">{tr("تعليمات التحويل بالعربية", "Payment Instructions (AR)")}</Label>
                    <Input
                      placeholder={tr("يرجى التحويل بالعملة المحلية وإرفاق صورة الوصل...", "Transfer in local currency and attach receipt...")}
                      value={newCountry.bank_instructions_ar}
                      onChange={(e) => setNewCountry({ ...newCountry, bank_instructions_ar: e.target.value })}
                      className="text-xs h-8 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">
                {tr("إلغاء", "Cancel")}
              </Button>
              <Button
                onClick={handleCreateCountry}
                disabled={addingSubmitting}
                className="rounded-xl bg-blue-600 text-white font-bold"
              >
                {addingSubmitting ? (tr("جاري الإضافة...", "Adding...")) : (tr("إضافة الدولة", "Add Country"))}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
