import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { tr } from '@/utils/tr';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { serviceService } from '@/services/apiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, Sparkles, Bot, Code2, Store, Zap, 
  ArrowRight, ArrowLeft, CheckCircle2, MessageCircle, Clock, ShieldCheck,
  ChevronDown, SlidersHorizontal, Layers, ShoppingBag
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
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [durationFilter, setDurationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
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

  // Category Icon helper matching the screenshot
  const getCategoryIcon = (type: string, slug?: string) => {
    if (slug === 'digital-products' || type === 'digital_product') {
      return <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />;
    }
    if (slug === 'saas-tools' || type === 'saas') {
      return <Code2 className="h-4 w-4 text-blue-500 shrink-0" />;
    }
    if (slug === 'ecommerce-projects' || type === 'ecommerce_project') {
      return <Store className="h-4 w-4 text-purple-500 shrink-0" />;
    }
    if (slug === 'ai-agents' || type === 'ai_agent') {
      return <Bot className="h-4 w-4 text-emerald-500 shrink-0" />;
    }
    return <Layers className="h-4 w-4 text-slate-500 shrink-0" />;
  };

  // Category badge style on top of card image
  const getCategoryBadgeStyle = (type: string, slug?: string) => {
    if (slug === 'digital-products' || type === 'digital_product') {
      return 'bg-[#7c3aed]/90 text-white border-purple-400/30';
    }
    if (slug === 'saas-tools' || type === 'saas') {
      return 'bg-[#2563eb]/90 text-white border-blue-400/30';
    }
    if (slug === 'ecommerce-projects' || type === 'ecommerce_project') {
      return 'bg-[#16a34a]/90 text-white border-green-400/30';
    }
    if (slug === 'ai-agents' || type === 'ai_agent') {
      return 'bg-[#9333ea]/90 text-white border-purple-400/30';
    }
    return 'bg-[#ec4899]/90 text-white border-pink-400/30';
  };

  // Category label text for card body
  const getCategoryLabel = (prod: any) => {
    if (prod.category_slug === 'digital-products' || prod.category_type === 'digital_product') {
      return isRtl ? 'منتج رقمي' : 'Digital Product';
    }
    if (prod.category_slug === 'saas-tools' || prod.category_type === 'saas') {
      return isRtl ? 'برمجيات SaaS' : 'SaaS Software';
    }
    if (prod.category_slug === 'ecommerce-projects' || prod.category_type === 'ecommerce_project') {
      return isRtl ? 'تجارة إلكترونية' : 'E-commerce';
    }
    if (prod.category_slug === 'ai-agents' || prod.category_type === 'ai_agent') {
      return isRtl ? 'وكلاء الذكاء الاصطناعي' : 'AI Agents';
    }
    return isRtl ? 'مشروع خاص' : 'Custom Project';
  };

  const getCategoryLabelColor = (prod: any) => {
    if (prod.category_slug === 'digital-products' || prod.category_type === 'digital_product') {
      return 'text-[#8b5cf6] dark:text-[#a78bfa]';
    }
    if (prod.category_slug === 'saas-tools' || prod.category_type === 'saas') {
      return 'text-[#3b82f6] dark:text-[#60a5fa]';
    }
    if (prod.category_slug === 'ecommerce-projects' || prod.category_type === 'ecommerce_project') {
      return 'text-[#22c55e] dark:text-[#4ade80]';
    }
    if (prod.category_slug === 'ai-agents' || prod.category_type === 'ai_agent') {
      return 'text-[#a855f7] dark:text-[#c084fc]';
    }
    return 'text-[#ec4899] dark:text-[#f472b6]';
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter by Price Range
    if (priceFilter === 'under20') {
      list = list.filter(p => Number(p.min_price || 0) < 20);
    } else if (priceFilter === '20to100') {
      list = list.filter(p => Number(p.min_price || 0) >= 20 && Number(p.min_price || 0) <= 100);
    } else if (priceFilter === 'over100') {
      list = list.filter(p => Number(p.min_price || 0) > 100);
    }

    // Filter by Duration
    if (durationFilter === 'monthly') {
      list = list.filter(p => p.description?.toLowerCase().includes('month') || p.category_type === 'digital_product' || p.category_type === 'saas');
    } else if (durationFilter === 'project') {
      list = list.filter(p => p.category_type === 'ecommerce_project' || p.category_slug === 'custom-projects');
    }

    // Sort
    if (sortBy === 'price_asc') {
      list.sort((a, b) => Number(a.min_price || 0) - Number(b.min_price || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => Number(b.min_price || 0) - Number(a.min_price || 0));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));
    } else {
      // Popular (sort_order ascending)
      list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }

    return list;
  }, [products, priceFilter, durationFilter, sortBy]);

  const whatsappNumber = settings?.support_whatsapp_number || '+212600000000';
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 pb-16">
        {/* Top Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b0f19] via-[#0f172a] to-[#0c0f1d] text-white p-8 md:p-10 border border-slate-800 shadow-2xl">
          {/* Subtle glow circles */}
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-10 -bottom-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 top-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Column: Text & Search */}
            <div className="space-y-4 max-w-2xl w-full">
              {/* Premium Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-semibold shadow-inner">
                <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
                <span>{tr("Premium Digital Services", "Premium Digital Services")}</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                {tr("Premium Digital Services & Projects", "Premium Digital Services & Projects")}
              </h1>

              {/* Subtitle */}
              <p className="text-slate-300 text-sm md:text-base leading-relaxed font-normal">
                {tr(
                  "Boost your productivity with the best AI tools, software, and ready-to-use projects.",
                  "Boost your productivity with the best AI tools, software, and ready-to-use projects."
                )}
              </p>

              {/* Search Bar Input */}
              <div className="pt-2 relative max-w-xl">
                <div className="relative flex items-center">
                  <Input
                    type="text"
                    placeholder={tr("Search for services, products, or tools...", "Search for services, products, or tools...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 pl-5 pr-12 text-sm shadow-xl border-0 focus-visible:ring-2 focus-visible:ring-purple-500 transition-all font-medium"
                  />
                  <div className="absolute right-4 rtl:right-auto rtl:left-4 text-slate-400 pointer-events-none">
                    <Search className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Laptop / Visual Artwork */}
            <div className="w-full lg:w-auto flex justify-center shrink-0">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition duration-500" />
                <img
                  src="/services/hero_laptop.jpg"
                  alt="Premium Services & AI Hub"
                  className="relative w-72 sm:w-80 md:w-96 rounded-2xl object-cover shadow-2xl border border-slate-700/60 transform group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Pills Row (Matching Screenshot 1) */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-2">
          {/* All Services Pill */}
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-2 transition-all shadow-sm ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{tr("All Services", "All Services")}</span>
          </button>

          {/* Dynamic Categories */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-2 transition-all shadow-sm ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {getCategoryIcon(cat.type, cat.slug)}
                <span>{isRtl ? cat.name_ar : cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Row: Categories, Price Range, Durations, and Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Left: Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-sm">
                  <span>
                    {selectedCategory === 'all' 
                      ? tr("All Categories", "All Categories")
                      : categories.find(c => c.slug === selectedCategory)?.name || tr("All Categories", "All Categories")}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                  {tr("All Categories", "All Categories")}
                </DropdownMenuItem>
                {categories.map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => setSelectedCategory(c.slug)}>
                    {isRtl ? c.name_ar : c.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Price Range Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-sm">
                  <span>
                    {priceFilter === 'all' && tr("Price Range", "Price Range")}
                    {priceFilter === 'under20' && tr("Under $20", "Under $20")}
                    {priceFilter === '20to100' && tr("$20 - $100", "$20 - $100")}
                    {priceFilter === 'over100' && tr("Over $100", "Over $100")}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem onClick={() => setPriceFilter('all')}>{tr("All Prices", "All Prices")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriceFilter('under20')}>{tr("Under $20", "Under $20")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriceFilter('20to100')}>{tr("$20 - $100", "$20 - $100")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriceFilter('over100')}>{tr("Over $100", "Over $100")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Durations Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-sm">
                  <span>
                    {durationFilter === 'all' && tr("All Durations", "All Durations")}
                    {durationFilter === 'monthly' && tr("Monthly Subscriptions", "Monthly Subscriptions")}
                    {durationFilter === 'project' && tr("Full Projects", "Full Projects")}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => setDurationFilter('all')}>{tr("All Durations", "All Durations")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDurationFilter('monthly')}>{tr("Monthly Subscriptions", "Monthly Subscriptions")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDurationFilter('project')}>{tr("Full Projects", "Full Projects")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right: Sort By */}
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-sm">
                  <span className="text-slate-400 font-normal">{tr("Sort by:", "Sort by:")}</span>
                  <span>
                    {sortBy === 'popular' && tr("Popular", "Popular")}
                    {sortBy === 'price_asc' && tr("Price: Low to High", "Price: Low to High")}
                    {sortBy === 'price_desc' && tr("Price: High to Low", "Price: High to Low")}
                    {sortBy === 'newest' && tr("Newest", "Newest")}
                  </span>
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSortBy('popular')}>{tr("Popular", "Popular")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('price_asc')}>{tr("Price: Low to High", "Price: Low to High")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('price_desc')}>{tr("Price: High to Low", "Price: High to Low")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('newest')}>{tr("Newest", "Newest")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Product Cards Grid: 4 columns */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-9 w-24 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-muted-foreground mb-4">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {tr("لم يتم العثور على خدمات مطابقة", "No matching services found")}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {tr("جرب البحث بكلمة مختلفة أو اختر فئة أخرى.", "Try different search terms or choose another category.")}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setPriceFilter('all'); }}
            >
              {tr("عرض جميع الخدمات", "View All Services")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => {
              const priceVal = prod.min_price ? Number(prod.min_price).toFixed(2) : '0.00';
              const isRecurring = prod.category_type === 'digital_product' || prod.category_type === 'saas' || (prod.description && prod.description.includes('month'));
              const isFromPrice = prod.offers_count > 1 || prod.slug === 'google-one-ai-premium' || prod.slug === 'gemini-advanced' || prod.slug === 'veo-3' || prod.slug === 'custom-project-development';

              return (
                <div
                  key={prod.id}
                  className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Top: Image & Badge */}
                  <div>
                    <div className="relative h-48 w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                      {prod.logo_url ? (
                        <img
                          src={prod.logo_url}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                          <Sparkles className="h-8 w-8" />
                        </div>
                      )}

                      {/* Category Badge overlay on top-left of image */}
                      <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide backdrop-blur-md border shadow-md ${getCategoryBadgeStyle(prod.category_type, prod.category_slug)}`}>
                          {getCategoryLabel(prod)}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-1.5">
                      {/* Category Label */}
                      <span className={`text-[11px] font-semibold tracking-wide block ${getCategoryLabelColor(prod)}`}>
                        {getCategoryLabel(prod)}
                      </span>

                      {/* Title */}
                      <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                        {isRtl ? prod.name_ar : prod.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-normal leading-relaxed">
                        {isRtl ? (prod.description_ar || prod.description) : prod.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom: Price and View Details */}
                  <div className="p-4 pt-1 space-y-3">
                    {/* Price line */}
                    <div className="flex items-baseline gap-1">
                      {isFromPrice && (
                        <span className="text-xs font-normal text-slate-400">
                          {tr("From", "From")}{" "}
                        </span>
                      )}
                      <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                        ${priceVal}
                      </span>
                      {isRecurring && (
                        <span className="text-xs font-normal text-slate-400">
                          {" "}/ month
                        </span>
                      )}
                    </div>

                    {/* View Details Button */}
                    <Link to={`/student/services/${prod.slug}`} className="block w-full">
                      <button className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm group-hover:border-primary/50">
                        <span>{tr("View Details", "View Details")}</span>
                        {isRtl ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating WhatsApp Support Button */}
        <a
          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent('مرحباً، أود الاستفسار عن خدمات ومنتجات Nextvora')}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 rtl:left-6 ltr:right-6 z-50 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 font-semibold text-xs md:text-sm"
          title={tr("Direct WhatsApp Support", "Direct WhatsApp Support")}
        >
          <MessageCircle className="h-5 w-5 fill-current" />
          <span className="hidden sm:inline">{tr("WhatsApp Help", "WhatsApp Help")}</span>
        </a>
      </div>
    </DashboardLayout>
  );
}
