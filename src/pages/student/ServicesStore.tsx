import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tr } from '@/utils/tr';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { serviceService } from '@/services/apiService';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ShoppingBag, Search, Sparkles, Bot, Code2, Store, Zap, 
  ExternalLink, ArrowRight, ArrowLeft, CheckCircle2, MessageCircle, Clock, ShieldCheck 
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServicesStore() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchInitialData = async () => {
    try {
      const [catsRes, setRes] = await Promise.all([
        serviceService.getCategories(),
        serviceService.getPublicSettings()
      ]);
      if (catsRes?.success) setCategories(catsRes.data || []);
      if (setRes?.success) setSettings(setRes.data || {});
    } catch (err: any) {
      console.error('Failed to load initial services data:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'all') {
        params.category_slug = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await serviceService.getProducts(params);
      if (res?.success) {
        setProducts(res.data || []);
      }
    } catch (err: any) {
      toast.error(tr('فشل تحميل المنتجات', 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'digital_product': return <Sparkles className="h-4 w-4 text-amber-500" />;
      case 'saas': return <Code2 className="h-4 w-4 text-blue-500" />;
      case 'ecommerce_project': return <Store className="h-4 w-4 text-purple-500" />;
      case 'ai_agent': return <Bot className="h-4 w-4 text-emerald-500" />;
      default: return <ShoppingBag className="h-4 w-4 text-primary" />;
    }
  };

  const whatsappNumber = settings?.support_whatsapp_number || '+212600000000';
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader
            title={tr("متجر الخدمات الرقمية", "Digital Services Store")}
            description={tr(
              "اشتراكات الذكاء الاصطناعي، برمجيات SaaS، مشاريع التجارة الإلكترونية، وتطوير الأنظمة الخاصة مع تسليم وضمان مباشر من الإدارة.",
              "AI subscriptions, SaaS tools, turnkey e-commerce stores, and custom software delivered directly by administration."
            )}
            breadcrumbs={[
              { label: tr("الرئيسية", "Dashboard"), href: "/student" },
              { label: tr("الخدمات والمنتجات", "Services & Store") }
            ]}
          />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 border-emerald-500/30 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              onClick={() => navigate('/student/services/my-orders')}
            >
              <Clock className="h-4 w-4" />
              {tr("طلباتي السابقة", "My Orders")}
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
              onClick={() => navigate('/student/services/custom-project')}
            >
              <Zap className="h-4 w-4" />
              {tr("طلب مشروع خاص", "Custom Project")}
            </Button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-10 border border-indigo-500/20 shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1 text-xs gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              {tr("تسليم يدوي موثوق 100% مع ضمان كامل", "100% Verified Manual Delivery with Full Guarantee")}
            </Badge>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {tr("حلول تقنية جاهزة تدعم نمو عملك في ثوانٍ", "Ready-to-Deploy Tech Solutions to Scale Your Business")}
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              {tr(
                "وفّر وقتك وتكاليفك مع اشتراكات وحسابات الذكاء الاصطناعي الرسمية (ChatGPT, Claude, Gemini)، برمجيات الأتمتة، وحلول التجارة الإلكترونية المطورة من خبراء المنصة.",
                "Save time and cost with verified AI accounts, cloud automation software, and turnkey e-commerce stores curated by experts."
              )}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 font-medium"
                onClick={() => navigate('/student/services/custom-project')}
              >
                {tr("طلب استشارة أو مشروع برمجي خاص", "Request Bespoke Project")}
                {isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </Button>
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent('مرحباً، أود الاستفسار عن خدمات ومنتجات Nextvora')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {tr("تواصل مباشر عبر WhatsApp للدعم الفني", "WhatsApp Support Available")}
              </a>
            </div>
          </div>

          {/* Background Decorative Elements */}
          <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/4 -top-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="rounded-full px-4 gap-2 text-xs font-medium shrink-0"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {tr("الكل", "All Services")}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.slug)}
                className="rounded-full px-4 gap-2 text-xs font-medium shrink-0"
              >
                {getCategoryIcon(cat.type)}
                {isRtl ? cat.name_ar : cat.name}
              </Button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={tr("ابحث عن خدمة أو اشتراك...", "Search service or tool...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-full pr-9 rtl:pr-9 ltr:pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border border-slate-200 dark:border-slate-800">
                <Skeleton className="h-44 w-full" />
                <CardHeader className="space-y-2 p-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0">
                  <Skeleton className="h-12 w-full" />
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-9 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card className="text-center p-12 border-dashed border-2">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-muted-foreground">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">
                {tr("لم يتم العثور على خدمات مطابقة", "No matching services found")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tr("جرب البحث بكلمة مختلفة أو تصفح باقي الفئات المتاحة.", "Try searching with different keywords or browse other categories.")}
              </p>
              <Button variant="outline" size="sm" onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}>
                {tr("عرض جميع الخدمات", "View All Services")}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((prod) => (
              <Card 
                key={prod.id} 
                className="group flex flex-col justify-between overflow-hidden border border-slate-200/80 dark:border-slate-800 hover:border-primary/40 dark:hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card rounded-2xl"
              >
                <div>
                  {/* Card Thumbnail / Header */}
                  <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-900/60 overflow-hidden flex items-center justify-center p-4">
                    {prod.logo_url ? (
                      <img
                        src={prod.logo_url}
                        alt={prod.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Sparkles className="h-8 w-8" />
                      </div>
                    )}
                    <Badge className="absolute top-3 right-3 rtl:right-3 ltr:left-3 bg-background/90 text-foreground backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-700 text-[11px] font-medium gap-1">
                      {getCategoryIcon(prod.category_type)}
                      {isRtl ? prod.category_name_ar : prod.category_name}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {isRtl ? prod.name_ar : prod.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {isRtl ? (prod.description_ar || prod.description) : prod.description}
                    </p>

                    {/* Features Snippet */}
                    {Array.isArray(prod.features) && prod.features.length > 0 && (
                      <div className="pt-2 space-y-1.5 border-t border-slate-100 dark:border-slate-800/80">
                        {prod.features.slice(0, 2).map((feat: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{typeof feat === 'string' ? feat : (isRtl ? feat.ar || feat.en : feat.en)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        {tr("يبدأ من", "Starts from")}
                      </span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        ${prod.min_price ? Number(prod.min_price).toFixed(2) : '0.00'}
                      </span>
                    </div>

                    <Link to={`/student/services/${prod.slug}`}>
                      <Button size="sm" className="gap-1.5 rounded-xl font-medium shadow-sm group-hover:shadow-md">
                        {tr("عرض التفاصيل", "View Details")}
                        {isRtl ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Custom Project Callout Card */}
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/20 via-background to-purple-950/20 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-start">
            <h2 className="text-xl font-bold tracking-tight">
              {tr("هل لديك فكرة مشروع مخصص أو تبحث عن نظام خاص؟", "Have an Idea for a Custom System or Bespoke Web App?")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tr(
                "فريقنا التقني في Nextvora مستعد لبناء وتطوير متاجرك، أنظمة SaaS، أو بوتات الذكاء الاصطناعي من الصفر بأسعار تنافسية وتسليم يدوي مرحلي متكامل.",
                "Our development team builds custom web apps, e-commerce stores, and AI automation tailored to your unique requirements."
              )}
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shrink-0 shadow-lg"
            onClick={() => navigate('/student/services/custom-project')}
          >
            <Zap className="h-4 w-4" />
            {tr("أرسل تفاصيل مشروعك الآن", "Submit Project Details")}
          </Button>
        </div>

        {/* Floating WhatsApp Support Button */}
        <a
          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent('مرحباً، أود الاستفسار عن خدمات ومنتجات Nextvora')}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 rtl:left-6 ltr:right-6 z-50 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 font-medium text-xs md:text-sm"
          title={tr("تواصل مباشر عبر واتساب", "Direct WhatsApp Support")}
        >
          <MessageCircle className="h-5 w-5 fill-current" />
          <span className="hidden sm:inline">{tr("مساعدة عبر WhatsApp", "WhatsApp Help")}</span>
        </a>
      </div>
    </DashboardLayout>
  );
}
