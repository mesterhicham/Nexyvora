import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tr } from '@/utils/tr';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { adminServiceService } from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  ShoppingBag, Plus, Edit2, Trash2, Eye, EyeOff, Search, 
  Sparkles, Layers, DollarSign, Package, Check, Loader2, ArrowUpDown, ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServicesManagement() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Product form fields
  const [formName, setFormName] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDescriptionAr, setFormDescriptionAr] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formDeliveryInfoAr, setFormDeliveryInfoAr] = useState('');
  const [formRequiresEmail, setFormRequiresEmail] = useState(false);
  const [formStatus, setFormStatus] = useState('published');
  const [formOffers, setFormOffers] = useState<any[]>([
    { label: '1 Month', label_ar: 'شهر واحد', duration_months: 1, price: 20, cost_price: 15, is_active: 1 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes, statsRes] = await Promise.all([
        adminServiceService.getProducts(),
        adminServiceService.getCategories(),
        adminServiceService.getStats()
      ]);

      if (prodsRes?.success) setProducts(prodsRes.data || []);
      if (catsRes?.success) setCategories(catsRes.data || []);
      if (statsRes?.success) setStats(statsRes.data || {});
    } catch (err: any) {
      toast.error(tr('فشل تحميل بيانات الخدمات', 'Failed to load services data'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormName('');
    setFormNameAr('');
    setFormSlug('');
    setFormCategoryId(categories[0]?.id || '');
    setFormDescription('');
    setFormDescriptionAr('');
    setFormLogoUrl('');
    setFormDeliveryInfoAr('يتم تسليم الحساب والاشتراك يدوياً من الإدارة خلال مدة أقصاها 24 ساعة.');
    setFormRequiresEmail(false);
    setFormStatus('published');
    setFormOffers([
      { label: '1 Month', label_ar: 'شهر واحد', duration_months: 1, price: 20, cost_price: 15, is_active: 1 }
    ]);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setFormName(prod.name || '');
    setFormNameAr(prod.name_ar || '');
    setFormSlug(prod.slug || '');
    setFormCategoryId(prod.category_id || '');
    setFormDescription(prod.description || '');
    setFormDescriptionAr(prod.description_ar || '');
    setFormLogoUrl(prod.logo_url || '');
    setFormDeliveryInfoAr(prod.delivery_info_ar || '');
    setFormRequiresEmail(prod.requires_email === 1);
    setFormStatus(prod.status || 'published');
    setFormOffers(prod.offers && prod.offers.length > 0 ? prod.offers : [
      { label: '1 Month', label_ar: 'شهر واحد', duration_months: 1, price: 20, cost_price: 15, is_active: 1 }
    ]);
    setIsProductModalOpen(true);
  };

  const handleAddOfferRow = () => {
    setFormOffers([
      ...formOffers,
      { label: '3 Months', label_ar: '3 أشهر', duration_months: 3, price: 50, cost_price: 40, is_active: 1 }
    ]);
  };

  const handleRemoveOfferRow = (index: number) => {
    if (formOffers.length <= 1) {
      toast.error(tr('يجب أن يحتوي المنتج على عرض سعر واحد على الأقل', 'Must have at least one offer'));
      return;
    }
    setFormOffers(formOffers.filter((_, i) => i !== index));
  };

  const handleOfferChange = (index: number, field: string, value: any) => {
    const updated = [...formOffers];
    updated[index][field] = value;
    setFormOffers(updated);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNameAr.trim() || !formSlug.trim() || !formCategoryId) {
      toast.error(tr('اسم المنتج بالعربية، الفئة، والرابط التعريفي حقول مطلوبة', 'Required fields missing'));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formName.trim() || formNameAr.trim(),
        name_ar: formNameAr.trim(),
        slug: formSlug.trim().toLowerCase().replace(/\s+/g, '-'),
        category_id: formCategoryId,
        description: formDescription.trim(),
        description_ar: formDescriptionAr.trim(),
        logo_url: formLogoUrl.trim() || undefined,
        delivery_info_ar: formDeliveryInfoAr.trim() || undefined,
        requires_email: formRequiresEmail ? 1 : 0,
        status: formStatus,
        offers: formOffers
      };

      if (editingProduct) {
        await adminServiceService.updateProduct(editingProduct.id, payload);
        toast.success(tr('تم تعديل المنتج بنجاح', 'Product updated successfully'));
      } else {
        await adminServiceService.createProduct(payload);
        toast.success(tr('تم إضافة المنتج الجديد بنجاح', 'Product created successfully'));
      }

      setIsProductModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || tr('حدث خطأ أثناء حفظ المنتج', 'Failed to save product'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (prod: any) => {
    const newStatus = prod.status === 'published' ? 'hidden' : 'published';
    try {
      await adminServiceService.updateProduct(prod.id, { status: newStatus });
      toast.success(tr(`تم تغيير حالة المنتج إلى: ${newStatus}`, `Status updated to ${newStatus}`));
      fetchData();
    } catch (err) {
      toast.error(tr('فشل تعديل الحالة', 'Failed to update status'));
    }
  };

  const filteredProducts = products.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.name_ar?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader
            title={tr("إدارة الخدمات والمنتجات الرقمية", "Services & Digital Products Management")}
            description={tr(
              "إدارة الفئات، المنتجات، الاشتراكات، خطط الأسعار والتحكم الكامل في ظهور المنتجات وعمولاتها.",
              "Manage service categories, products, subscription durations, offers, and pricing."
            )}
            breadcrumbs={[
              { label: tr("لوحة الإدارة", "Admin Dashboard"), href: "/admin" },
              { label: tr("إدارة الخدمات", "Services Management") }
            ]}
          />
          <Button onClick={handleOpenAddProduct} className="gap-2 bg-primary font-bold shadow-md">
            <Plus className="h-4 w-4" />
            {tr("إضافة منتج أو اشتراك جديد", "Add New Product")}
          </Button>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border">
              <span className="text-xs text-muted-foreground block">{tr("إجمالي المنتجات", "Total Products")}</span>
              <span className="text-2xl font-black">{stats.productsCount || 0}</span>
            </Card>
            <Card className="p-4 border">
              <span className="text-xs text-muted-foreground block">{tr("إجمالي الطلبات", "Total Orders")}</span>
              <span className="text-2xl font-black">{stats.orders?.total_orders || 0}</span>
            </Card>
            <Card className="p-4 border">
              <span className="text-xs text-muted-foreground block">{tr("حجم المبيعات الإجمالي", "Total Sales Volume")}</span>
              <span className="text-2xl font-black text-emerald-600">${Number(stats.orders?.total_sales_volume || 0).toFixed(2)}</span>
            </Card>
            <Card className="p-4 border">
              <span className="text-xs text-muted-foreground block">{tr("عمولات الخدمات المصروفة (10%)", "Direct Commissions Paid")}</span>
              <span className="text-2xl font-black text-amber-600">${Number(stats.commissions?.total_commissions_paid || 0).toFixed(2)}</span>
            </Card>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tr("بحث باسم المنتج أو الرابط...", "Search products...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 rtl:pr-9 ltr:pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Products Table */}
        <Card className="border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b text-muted-foreground font-semibold">
                <tr>
                  <th className="p-4 text-start">{tr("المنتج", "Product")}</th>
                  <th className="p-4 text-start">{tr("الفئة", "Category")}</th>
                  <th className="p-4 text-start">{tr("عروض الأسعار", "Offers")}</th>
                  <th className="p-4 text-start">{tr("الحالة", "Status")}</th>
                  <th className="p-4 text-start">{tr("إجمالي المبيعات", "Total Revenue")}</th>
                  <th className="p-4 text-end">{tr("الإجراءات", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="p-4"><Skeleton className="h-6 w-full" /></td></tr>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      {tr("لا توجد منتجات مسجلة حتى الآن", "No products found")}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {prod.logo_url ? (
                            <img src={prod.logo_url} alt={prod.name} className="w-10 h-10 object-contain rounded-lg border p-1" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                              <Sparkles className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold block text-foreground text-sm">{prod.name_ar}</span>
                            <span className="text-[11px] text-muted-foreground font-mono" dir="ltr">/{prod.slug}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <Badge variant="outline">{prod.category_name_ar || prod.category_name}</Badge>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          {prod.offers && prod.offers.map((off: any) => (
                            <div key={off.id} className="text-[11px] text-muted-foreground">
                              {off.label_ar}: <strong className="text-emerald-600">${Number(off.price).toFixed(2)}</strong>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-4">
                        <Badge className={prod.status === 'published' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-500/10 text-slate-600'}>
                          {prod.status === 'published' ? tr("منشور", "Published") : tr("مخفي", "Hidden")}
                        </Badge>
                      </td>

                      <td className="p-4 font-bold text-foreground">
                        ${Number(prod.total_revenue || 0).toFixed(2)}
                      </td>

                      <td className="p-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title={prod.status === 'published' ? "إخفاء" : "نشر"}
                            onClick={() => handleToggleStatus(prod)}
                          >
                            {prod.status === 'published' ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-primary"
                            onClick={() => handleOpenEditProduct(prod)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add/Edit Product Modal */}
        <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {editingProduct ? tr("تعديل تفاصيل المنتج", "Edit Product") : tr("إضافة منتج أو اشتراك رقمي جديد", "Add New Product")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {tr("أدخل تفاصيل الخدمة والخيارات وخطط الأسعار المختلفة", "Enter product info, description and duration offers")}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveProduct} className="space-y-5 py-2">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{tr("اسم المنتج بالعربية *", "Arabic Name *")}</Label>
                  <Input
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    placeholder="اشتراك ChatGPT Plus رسمي"
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{tr("اسم المنتج بالإنجليزية", "English Name")}</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ChatGPT Plus Subscription"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{tr("الرابط التعريفي (Slug) *", "Slug URL *")}</Label>
                  <Input
                    dir="ltr"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="chatgpt-plus"
                    required
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{tr("فئة الخدمة *", "Category *")}</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isRtl ? c.name_ar : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr("رابط الشعار أو الصورة (Logo URL)", "Logo URL")}</Label>
                <Input
                  dir="ltr"
                  value={formLogoUrl}
                  onChange={(e) => setFormLogoUrl(e.target.value)}
                  placeholder="https://... أو مسار الصورة"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr("وصف الخدمة بالعربية", "Arabic Description")}</Label>
                <Textarea
                  rows={3}
                  value={formDescriptionAr}
                  onChange={(e) => setFormDescriptionAr(e.target.value)}
                  placeholder="حساب رسمي مفعل مع وصول كامل لكافة نماذج GPT-4o وتوليد الصور..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr("تعليمات وشروط التسليم للعميل", "Delivery Instructions")}</Label>
                <Textarea
                  rows={2}
                  value={formDeliveryInfoAr}
                  onChange={(e) => setFormDeliveryInfoAr(e.target.value)}
                  placeholder="يتم تسليم بيانات الحساب يدوياً من الإدارة خلال 24 ساعة..."
                  className="text-xs"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50 dark:bg-slate-900/40">
                <input
                  type="checkbox"
                  id="requires_email"
                  checked={formRequiresEmail}
                  onChange={(e) => setFormRequiresEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="requires_email" className="text-xs cursor-pointer font-medium">
                  {tr("يتطلب إدخال البريد الإلكتروني للتفعيل من العميل قبل الشراء", "Requires client activation email at checkout")}
                </Label>
              </div>

              {/* Offers Manager */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    {tr("خطط ومدد الأسعار (Offers)", "Duration & Pricing Plans")}
                  </Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddOfferRow} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" />
                    {tr("إضافة مدة جديدة", "Add Plan")}
                  </Button>
                </div>

                <div className="space-y-2">
                  {formOffers.map((off, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-lg border bg-card">
                      <div className="col-span-4">
                        <Input
                          placeholder="الاسم (شهر واحد)"
                          value={off.label_ar}
                          onChange={(e) => handleOfferChange(idx, 'label_ar', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          placeholder="السعر $"
                          value={off.price}
                          onChange={(e) => handleOfferChange(idx, 'price', e.target.value)}
                          className="h-8 text-xs font-bold text-emerald-600"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          placeholder="التكلفة $"
                          value={off.cost_price || ''}
                          onChange={(e) => handleOfferChange(idx, 'cost_price', e.target.value)}
                          className="h-8 text-xs text-muted-foreground"
                          title="التكلفة الداخلية للمنصة (خاص بالإدارة)"
                        />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={() => handleRemoveOfferRow(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsProductModalOpen(false)}>
                  {tr("إلغاء", "Cancel")}
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2 bg-primary font-bold">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {tr("حفظ المنتج", "Save Product")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
