import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAllNews, useCreateNews, useUpdateNews, useDeleteNews } from '@/hooks/useAdminFeatures';
import { uploadService } from '@/services/apiService';
import {
  Newspaper,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Video,
  Image as ImageIcon,
  FileSpreadsheet,
  FileText,
  Presentation,
  Upload,
  Link,
  Star,
  Check,
  X,
  Copy,
  ExternalLink,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

type AdminTabType = 'all' | 'news' | 'articles' | 'video' | 'images' | 'pdf' | 'presentations';

interface ContentFormData {
  title: string;
  content: string;
  type: string;
  priority: string;
  target_audience: string;
  is_published: boolean;
  is_featured: boolean;
  media_url?: string;
  media_name?: string;
  media_size?: number;
  media_type?: string;
}

export default function NewsManagement() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState<AdminTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  const { data: newsItems, isLoading } = useAllNews();
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const deleteNews = useDeleteNews();

  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    content: '',
    type: 'news',
    priority: 'medium',
    target_audience: 'all',
    is_published: true,
    is_featured: false,
    media_url: '',
    media_name: '',
    media_size: 0,
    media_type: '',
  });

  const allItems = newsItems || [];

  // Tab Counts calculation
  const getTabCount = (tab: AdminTabType) => {
    if (tab === 'all') return allItems.length;
    return allItems.filter((item: any) => {
      const type = (item.type || '').toLowerCase();
      if (tab === 'news') return type === 'news';
      if (tab === 'articles') return type === 'article' || type === 'articles';
      if (tab === 'video') return type === 'video' || type === 'videos';
      if (tab === 'images') return type === 'image' || type === 'images';
      if (tab === 'pdf') return type === 'pdf';
      if (tab === 'presentations') return type === 'presentation' || type === 'presentations';
      return false;
    }).length;
  };

  const tabs: { id: AdminTabType; label: string }[] = [
    { id: 'all', label: isRtl ? `الكل (${getTabCount('all')})` : `All (${getTabCount('all')})` },
    { id: 'news', label: isRtl ? `أخبار (${getTabCount('news')})` : `News (${getTabCount('news')})` },
    { id: 'articles', label: isRtl ? `مقالات (${getTabCount('articles')})` : `Articles (${getTabCount('articles')})` },
    { id: 'video', label: isRtl ? `فيديو (${getTabCount('video')})` : `Video (${getTabCount('video')})` },
    { id: 'images', label: isRtl ? `صور (${getTabCount('images')})` : `Images (${getTabCount('images')})` },
    { id: 'pdf', label: isRtl ? `PDF (${getTabCount('pdf')})` : `PDF (${getTabCount('pdf')})` },
    { id: 'presentations', label: isRtl ? `عروض (${getTabCount('presentations')})` : `Presentations (${getTabCount('presentations')})` },
  ];

  // Filtered items based on activeTab & search
  const filteredItems = allItems.filter((item: any) => {
    const type = (item.type || '').toLowerCase();

    // Tab filter
    if (activeTab === 'news' && type !== 'news') return false;
    if (activeTab === 'articles' && type !== 'article' && type !== 'articles') return false;
    if (activeTab === 'video' && type !== 'video' && type !== 'videos') return false;
    if (activeTab === 'images' && type !== 'image' && type !== 'images') return false;
    if (activeTab === 'pdf' && type !== 'pdf') return false;
    if (activeTab === 'presentations' && type !== 'presentation' && type !== 'presentations') return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchContent = (item.content || '').toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }

    return true;
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      content: '',
      type: activeTab === 'all' ? 'news' : (activeTab === 'images' ? 'image' : activeTab === 'articles' ? 'article' : activeTab === 'presentations' ? 'presentation' : activeTab),
      priority: 'medium',
      target_audience: 'all',
      is_published: true,
      is_featured: false,
      media_url: '',
      media_name: '',
      media_size: 0,
      media_type: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type || 'news',
      priority: item.priority || 'medium',
      target_audience: item.target_audience || 'all',
      is_published: item.is_published ?? true,
      is_featured: !!item.is_featured,
      media_url: item.media_url || '',
      media_name: item.media_name || '',
      media_size: item.media_size || 0,
      media_type: item.media_type || '',
    });
    setIsFormOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadService.uploadFile(file);
      const url = res.url || `/uploads/${res.filename}`;
      
      let detectedType = formData.type;
      if (file.type.startsWith('video/')) detectedType = 'video';
      else if (file.type.startsWith('image/')) detectedType = 'image';
      else if (file.type.includes('pdf')) detectedType = 'pdf';
      else if (file.type.includes('presentation') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) detectedType = 'presentation';

      setFormData((prev) => ({
        ...prev,
        media_url: url,
        media_name: file.name,
        media_size: file.size,
        media_type: file.type,
        type: detectedType,
      }));
      toast.success(isRtl ? 'تم رفع الملف بنجاح!' : 'File uploaded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error(isRtl ? 'يرجى إدخال عنوان ومحتوى للخبر' : 'Please provide title and content');
      return;
    }

    try {
      if (editingItem) {
        await updateNews.mutateAsync({ id: editingItem.id, ...formData });
      } else {
        await createNews.mutateAsync(formData);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteNews.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const togglePublishStatus = async (item: any) => {
    try {
      await updateNews.mutateAsync({
        ...item,
        is_published: !item.is_published,
      });
      toast.success(isRtl ? 'تم تحديث حالة النشر' : 'Publication status updated');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getTypeBadge = (type: string) => {
    const t = (type || 'news').toLowerCase();
    switch (t) {
      case 'video':
      case 'videos':
        return <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 text-xs font-semibold gap-1"><Video className="w-3 h-3" /> Video</Badge>;
      case 'image':
      case 'images':
        return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 text-xs font-semibold gap-1"><ImageIcon className="w-3 h-3" /> Image</Badge>;
      case 'pdf':
        return <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 text-xs font-semibold gap-1"><FileSpreadsheet className="w-3 h-3" /> PDF</Badge>;
      case 'presentation':
      case 'presentations':
        return <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 text-xs font-semibold gap-1"><Presentation className="w-3 h-3" /> Presentation</Badge>;
      case 'article':
      case 'articles':
        return <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 text-xs font-semibold gap-1"><FileText className="w-3 h-3" /> Article</Badge>;
      default:
        return <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 text-xs font-semibold gap-1"><Newspaper className="w-3 h-3" /> News</Badge>;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* TOP HEADER (تطابق الهيدر الأزرق مع زر + New Content) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Newspaper className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isRtl ? 'مركز الأخبار والمحتوى' : 'News & Content Center'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRtl ? 'إدارة ونشر الأخبار، المقالات، الفيديوهات، الصور وملفات الـ PDF للأعضاء' : 'Manage published news, articles, media, and downloadable documents'}
              </p>
            </div>
          </div>

          <Button
            onClick={openAddModal}
            className="rounded-2xl h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-md shadow-blue-500/25"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isRtl ? '+ محتوى جديد' : '+ New Content'}</span>
          </Button>
        </div>

        {/* MAIN CARD CONTAINER */}
        <Card className="rounded-[28px] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_10px_35px_rgba(0,0,0,0.03)] p-6 space-y-6">
          {/* TABS CONTAINER (مطابق تماماً لمستطيل التبويبات في الصورة) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl overflow-x-auto scrollbar-none gap-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                      isActive
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* SEARCH */}
            <div className="relative w-full md:w-64">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder={isRtl ? 'بحث في العناوين...' : 'Search address/title...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 rounded-xl h-9 bg-slate-50 dark:bg-slate-800 border-none text-xs"
              />
            </div>
          </div>

          {/* TABLE SECTION (تطابق الأعمدة: Address, Type, Views, Status, Date, Actions) */}
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            /* EMPTY STATE (مطابق لعبارة No Content في الصورة) */
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <p className="text-slate-400 dark:text-slate-500 font-bold text-sm tracking-wide">
                {isRtl ? 'لا يوجد محتوى' : 'No Content'}
              </p>
              <p className="text-xs text-slate-300 dark:text-slate-600 mt-1 max-w-xs">
                {isRtl ? 'انقر على زر + محتوى جديد لإضافة أول منشور أو وسائط' : 'Click "+ New Content" above to add your first post or document.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 text-start">{isRtl ? 'العنوان (Address)' : 'Address'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'النوع' : 'Type'}</th>
                    <th className="py-3 px-4 text-center">{isRtl ? 'المشاهدات' : 'Views'}</th>
                    <th className="py-3 px-4 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                    <th className="py-3 px-4 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                  {filteredItems.map((item: any) => {
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        {/* ADDRESS (Title + preview + media icon) */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3 max-w-md">
                            {item.media_url ? (
                              item.type === 'image' ? (
                                <img src={item.media_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-800" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                                  {item.type === 'video' ? <Video className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                                </div>
                              )
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white truncate block">
                                  {item.title}
                                </span>
                                {item.is_featured && (
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 line-clamp-1">
                                {item.content}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* TYPE */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {getTypeBadge(item.type)}
                        </td>

                        {/* VIEWS */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {item.views_count || 0}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => togglePublishStatus(item)}
                            className="inline-flex items-center gap-1 cursor-pointer"
                            title={isRtl ? 'تبديل حالة النشر' : 'Toggle publish'}
                          >
                            {item.is_published ? (
                              <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 border-emerald-200 text-[11px] font-bold">
                                {isRtl ? 'منشور' : 'Published'}
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800 border-slate-200 text-[11px] font-bold">
                                {isRtl ? 'مسودة' : 'Draft'}
                              </Badge>
                            )}
                          </button>
                        </td>

                        {/* DATE */}
                        <td className="py-4 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                          {new Date(item.created_at || item.published_at || Date.now()).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-4 px-4 text-end whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Preview */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewItem(item)}
                              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              title={isRtl ? 'معاينة' : 'Preview'}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* Edit */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(item)}
                              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              title={isRtl ? 'تعديل' : 'Edit'}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(item.id)}
                              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title={isRtl ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* CREATE / EDIT MODAL */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-blue-600" />
                <span>
                  {editingItem 
                    ? (isRtl ? 'تعديل المحتوى' : 'Edit Content') 
                    : (isRtl ? 'إضافة محتوى جديد' : 'New Content')}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {isRtl 
                  ? 'املأ بيانات المنشور وحدد نوع الوسائط والمرفقات المتاحة للتحميل من قبل الأعضاء.' 
                  : 'Specify details, category, and attach downloadable assets or media for members.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* TITLE */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isRtl ? 'العنوان الرئيسي' : 'Title / Address'} *
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={isRtl ? 'أدخل عنوان الخبر أو المحتوى...' : 'Enter headline or title...'}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              {/* TYPE & AUDIENCE & PRIORITY GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isRtl ? 'نوع المحتوى' : 'Content Type'}
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger className="rounded-xl h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">{isRtl ? 'أخبار (News)' : 'News'}</SelectItem>
                      <SelectItem value="article">{isRtl ? 'مقال (Article)' : 'Article'}</SelectItem>
                      <SelectItem value="video">{isRtl ? 'فيديو (Video)' : 'Video'}</SelectItem>
                      <SelectItem value="image">{isRtl ? 'صورة (Image)' : 'Image'}</SelectItem>
                      <SelectItem value="pdf">{isRtl ? 'ملف PDF' : 'PDF Document'}</SelectItem>
                      <SelectItem value="presentation">{isRtl ? 'عرض تقديمي' : 'Presentation'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Audience */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isRtl ? 'الجمهور المستهدف' : 'Target Audience'}
                  </Label>
                  <Select
                    value={formData.target_audience}
                    onValueChange={(val) => setFormData({ ...formData, target_audience: val })}
                  >
                    <SelectTrigger className="rounded-xl h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isRtl ? 'الجميع (All)' : 'All'}</SelectItem>
                      <SelectItem value="students">{isRtl ? 'الطلاب / الأعضاء' : 'Students / Members'}</SelectItem>
                      <SelectItem value="teachers">{isRtl ? 'الأساتذة' : 'Teachers'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isRtl ? 'الأولوية' : 'Priority'}
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(val) => setFormData({ ...formData, priority: val })}
                  >
                    <SelectTrigger className="rounded-xl h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{isRtl ? 'عادي (Normal)' : 'Normal'}</SelectItem>
                      <SelectItem value="medium">{isRtl ? 'متوسط (Medium)' : 'Medium'}</SelectItem>
                      <SelectItem value="high">{isRtl ? 'هام (High)' : 'High'}</SelectItem>
                      <SelectItem value="urgent">{isRtl ? 'عاجل (Urgent)' : 'Urgent'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CONTENT BODY */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isRtl ? 'نص المحتوى / التفاصيل' : 'Content Body'} *
                </Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={isRtl ? 'اكتب تفاصيل الخبر أو المقال هنا...' : 'Write the content text here...'}
                  rows={4}
                  className="rounded-xl text-xs"
                />
              </div>

              {/* MEDIA ATTACHMENT SECTION (Upload or URL) */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>{isRtl ? 'المرفقات والوسائط (صور، فيديو، PDF)' : 'Attachment & Media (Image, Video, PDF)'}</span>
                  {formData.media_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, media_url: '', media_name: '', media_size: 0, media_type: '' })}
                      className="text-[11px] text-rose-500 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> {isRtl ? 'إزالة الملف' : 'Remove'}
                    </button>
                  )}
                </Label>

                {/* Upload Input */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 cursor-pointer hover:border-blue-500 transition-colors text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{isUploading ? (isRtl ? 'جاري الرفع...' : 'Uploading...') : (isRtl ? 'اختر ملفاً لرفعه من جهازك' : 'Choose file to upload')}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>

                  <span className="text-[11px] text-slate-400">{isRtl ? 'أو أدخل رابطاً' : 'or enter URL'}</span>

                  {/* External URL */}
                  <div className="flex-1 w-full relative">
                    <Link className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input
                      value={formData.media_url}
                      onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                      placeholder="https://..."
                      className="ps-8 rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Preview attached file */}
                {formData.media_url && (
                  <div className="mt-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                      {formData.type === 'video' ? <Video className="w-4 h-4" /> : formData.type === 'pdf' ? <FileSpreadsheet className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {formData.media_name || formData.media_url}
                      </p>
                    </div>
                    <a
                      href={formData.media_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* TOGGLES: PUBLISHED & FEATURED */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-slate-900 dark:text-white">
                      {isRtl ? 'نشر المحتوى فوراً' : 'Publish Immediately'}
                    </Label>
                    <p className="text-[10px] text-slate-400">
                      {isRtl ? 'يظهر مباشرة في لوحة تحكم الأعضاء' : 'Visible to users on News Center'}
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{isRtl ? 'تمييز في تبويب (المميز)' : 'Mark as Featured'}</span>
                    </Label>
                    <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70">
                      {isRtl ? 'يظهر بشارة مميز وفي مقدمة التبويبات' : 'Highlighted with a special badge'}
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl h-10 text-xs font-bold"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isUploading}
                className="rounded-xl h-10 px-5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              >
                {editingItem ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'نشر المحتوى' : 'Publish Content')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PREVIEW MODAL (معاينة حية للمحتوى تماماً كما يراه الطالب) */}
        <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
          <DialogContent className="max-w-xl rounded-3xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2">
                {previewItem && getTypeBadge(previewItem.type)}
                {previewItem?.is_featured && (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-xs gap-1">
                    <Star className="w-3 h-3 fill-amber-500" /> {isRtl ? 'مميز' : 'Featured'}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                {previewItem?.title}
              </DialogTitle>
            </DialogHeader>

            {previewItem && (
              <div className="space-y-4 py-2">
                {previewItem.media_url && (
                  <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                    {previewItem.type === 'video' || /\.(mp4|mov|webm)$/i.test(previewItem.media_url) ? (
                      <video src={previewItem.media_url} controls className="w-full aspect-video object-contain bg-black" />
                    ) : previewItem.type === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(previewItem.media_url) ? (
                      <img src={previewItem.media_url} alt="" className="w-full max-h-72 object-cover" />
                    ) : (
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="w-8 h-8 text-rose-500" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{previewItem.media_name || 'Document'}</p>
                            <span className="text-[10px] text-slate-400">PDF / Presentation</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(previewItem.media_url, '_blank')}
                          className="h-8 rounded-xl text-xs"
                        >
                          <Download className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1" />
                          {isRtl ? 'تنزيل' : 'Download'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {previewItem.content}
                </p>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>{new Date(previewItem.created_at || Date.now()).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-400">
                    <Eye className="w-3.5 h-3.5" /> {previewItem.views_count || 0} {isRtl ? 'مشاهدة' : 'Views'}
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* DELETE CONFIRMATION DIALOG */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-bold">
                {isRtl ? 'هل أنت متأكد من حذف هذا المحتوى؟' : 'Are you sure you want to delete this content?'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-500">
                {isRtl ? 'سيتم حذف هذا المنشور ومرفقاته نهائياً ولن يتمكن الأعضاء من الوصول إليه.' : 'This action cannot be undone. Members will no longer be able to access it.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl text-xs">{isRtl ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isRtl ? 'حذف نهائياً' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
