import { useState } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNews, useRecordNewsView } from '@/hooks/useAdminFeatures';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Newspaper, 
  FileText, 
  Video, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Star, 
  Search, 
  Copy, 
  Check, 
  Download, 
  Eye, 
  Calendar, 
  Share2, 
  ExternalLink,
  Sparkles,
  Play,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';

type CategoryType = 'all' | 'news' | 'article' | 'video' | 'image' | 'pdf' | 'featured';

export default function StudentNewsCenter() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch news targeted to all or students
  const { data: newsItems, isLoading } = useNews({ targetAudience: 'students' });
  const recordView = useRecordNewsView();

  const categories = [
    { id: 'all', label: tr("الأحدث", "Latest"), icon: Sparkles },
    { id: 'news', label: tr("أخبار", "News"), icon: Newspaper },
    { id: 'article', label: tr("مقالات", "Articles"), icon: FileText },
    { id: 'video', label: tr("فيديوهات", "Videos"), icon: Video },
    { id: 'image', label: tr("صور", "Images"), icon: ImageIcon },
    { id: 'pdf', label: tr("ملفات PDF", "PDF"), icon: FileSpreadsheet },
    { id: 'featured', label: tr("المميز", "Featured"), icon: Star },
  ];

  // Filter content
  const filteredItems = (newsItems || []).filter((item: any) => {
    // Category filter
    if (selectedCategory === 'featured') {
      if (!item.is_featured && item.priority !== 'featured') return false;
    } else if (selectedCategory !== 'all') {
      const itemType = (item.type || '').toLowerCase();
      if (selectedCategory === 'article' && itemType !== 'article' && itemType !== 'articles') return false;
      if (selectedCategory === 'video' && itemType !== 'video' && itemType !== 'videos') return false;
      if (selectedCategory === 'image' && itemType !== 'image' && itemType !== 'images') return false;
      if (selectedCategory === 'pdf' && itemType !== 'pdf') return false;
      if (selectedCategory === 'news' && itemType !== 'news') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchContent = (item.content || '').toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }

    return true;
  });

  const handleCopyText = (id: string, title: string, content: string) => {
    const fullText = `${title}\n\n${content}`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
    toast.success(tr("تم نسخ النص إلى الحافظة بنجاح!", "Text copied to clipboard!"));
  };

  const handleDownload = async (url: string, filename?: string) => {
    if (!url) return;
    try {
      toast.info(tr("جاري بدء التحميل...", "Starting download..."));
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || url.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(tr("تم تحميل الملف بنجاح!", "File downloaded successfully!"));
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleShare = (item: any) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.content?.slice(0, 100),
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/student/news#${item.id}`);
      toast.success(tr("تم نسخ رابط الخبر!", "Link copied to clipboard!"));
    }
  };

  const getTypeBadge = (type: string) => {
    const t = (type || 'news').toLowerCase();
    switch (t) {
      case 'video':
      case 'videos':
        return <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800 gap-1"><Video className="w-3 h-3" /> {tr("فيديو", "Video")}</Badge>;
      case 'image':
      case 'images':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1"><ImageIcon className="w-3 h-3" /> {tr("صورة", "Image")}</Badge>;
      case 'pdf':
        return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 gap-1"><FileSpreadsheet className="w-3 h-3" /> {tr("ملف PDF", "PDF")}</Badge>;
      case 'article':
      case 'articles':
        return <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 gap-1"><FileText className="w-3 h-3" /> {tr("مقال", "Article")}</Badge>;
      default:
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 gap-1"><Newspaper className="w-3 h-3" /> {tr("خبر", "News")}</Badge>;
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Newspaper className="w-6 h-6 stroke-[2.2]" />
              </span>
              <span>{tr("مركز الأخبار والمحتوى", "News Center")}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {tr("تابع كافة المستجدات، الإعلانات، المقالات، والوسائط القابلة للتحميل المنشورة من قبل الإدارة.", "Explore platform announcements, downloadable media, videos, and articles.")}
            </p>
          </div>

          {/* SEARCH BAR */}
          <div className="relative w-full md:w-72">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              type="text"
              placeholder={tr("بحث في المستجدات...", "Search news & content...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 rounded-2xl h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs shadow-xs"
            />
          </div>
        </div>

        {/* HORIZONTAL FILTER PILLS (تطابق التصميم الموجود في الصورة) */}
        <div className="flex items-center justify-center sm:justify-start overflow-x-auto pb-2 scrollbar-none gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as CategoryType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600/30' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* CONTENT DISPLAY AREA */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-[28px] p-5 space-y-4 border-slate-100 dark:border-slate-800">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 flex-1 rounded-xl" />
                  <Skeleton className="h-9 w-20 rounded-xl" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          /* EMPTY STATE (مطابق تماماً للصورة) */
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.03)] p-16 sm:p-24 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 border border-slate-100 dark:border-slate-700">
              <Newspaper className="w-10 h-10 stroke-[1.4]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300">
              {tr("لا يوجد محتوى متاح حالياً", "No content available")}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {tr("لم يتم نشر أي مستجدات أو مواد في هذا التصنيف بعد. تفقد الأقسام الأخرى أو عد لاحقاً.", "There are no updates or assets available in this category right now.")}
            </p>
          </div>
        ) : (
          /* CONTENT CARDS STREAM */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item: any) => {
              const hasMedia = !!item.media_url;
              const isVideo = item.type === 'video' || item.media_type?.includes('video') || (item.media_url && /\.(mp4|mov|webm)$/i.test(item.media_url));
              const isImage = item.type === 'image' || item.media_type?.includes('image') || (item.media_url && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.media_url));
              const isPdf = item.type === 'pdf' || item.media_type?.includes('pdf') || (item.media_url && /\.pdf$/i.test(item.media_url));
              const isFeatured = item.is_featured || item.priority === 'featured' || item.priority === 'high';

              return (
                <Card 
                  key={item.id}
                  id={item.id}
                  className="rounded-[28px] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* MEDIA PREVIEW SECTION */}
                    {hasMedia && (
                      <div className="relative w-full overflow-hidden bg-slate-950/5 dark:bg-slate-950/40">
                        {isVideo ? (
                          <div className="relative aspect-video bg-black flex items-center justify-center">
                            <video 
                              src={item.media_url} 
                              controls 
                              className="w-full h-full object-contain"
                              preload="metadata"
                            />
                          </div>
                        ) : isImage ? (
                          <div className="relative aspect-video overflow-hidden group/img">
                            <img 
                              src={item.media_url} 
                              alt={item.title} 
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 cursor-pointer"
                              onClick={() => window.open(item.media_url, '_blank')}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-3">
                              <span className="text-[11px] text-white flex items-center gap-1 font-semibold">
                                <ExternalLink className="w-3 h-3" /> {tr("عرض الصورة بالحجم الكامل", "Open full image")}
                              </span>
                            </div>
                          </div>
                        ) : isPdf ? (
                          <div className="p-6 flex items-center gap-4 bg-gradient-to-br from-rose-500/5 to-orange-500/5 border-b border-rose-100/30 dark:border-rose-900/20">
                            <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
                              <FileSpreadsheet className="w-7 h-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold uppercase tracking-wider">
                                <span>PDF Document</span>
                                {item.media_size && (
                                  <span className="text-[10px] text-slate-400">
                                    • {(item.media_size / (1024 * 1024)).toFixed(1)} MB
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                                {item.media_name || item.title}
                              </p>
                              <a 
                                href={item.media_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1 mt-1"
                              >
                                {tr("معاينة المستند", "Preview Document")} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                              <FileCheck className="w-6 h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {item.media_name || 'Attached Asset'}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {item.media_type || 'Downloadable file'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CARD BODY */}
                    <div className="p-5 space-y-3">
                      {/* META BADGES */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          {getTypeBadge(item.type)}
                          {isFeatured && (
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1">
                              <Star className="w-3 h-3 fill-amber-500" /> {tr("مميز", "Featured")}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.created_at || item.published_at || Date.now()).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.views_count || 0}
                          </span>
                        </div>
                      </div>

                      {/* TITLE */}
                      <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h2>

                      {/* TEXT CONTENT */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line line-clamp-4">
                        {item.content}
                      </p>
                    </div>
                  </div>

                  {/* BOTTOM ACTION TOOLBAR */}
                  <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 pt-3">
                      {/* COPY TEXT BUTTON (المطلوب في التذكرة) */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyText(item.id, item.title, item.content)}
                        className={`flex-1 h-9 rounded-xl text-xs font-bold gap-1.5 transition-all ${
                          copiedId === item.id 
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border-emerald-200' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{tr("تم النسخ", "Copied")}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>{tr("نسخ النص", "Copy Text")}</span>
                          </>
                        )}
                      </Button>

                      {/* DOWNLOAD BUTTON (المطلوب في التذكرة) */}
                      {hasMedia && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleDownload(item.media_url, item.media_name)}
                          className="h-9 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm shadow-blue-500/20"
                          title={tr("تحميل الملف أو الوسائط", "Download asset")}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{tr("تنزيل", "Download")}</span>
                        </Button>
                      )}

                      {/* SHARE BUTTON */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(item)}
                        className="h-9 w-9 p-0 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                        title={tr("مشاركة", "Share")}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
