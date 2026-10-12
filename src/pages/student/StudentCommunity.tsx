import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Heart,
  Send,
  PlusCircle,
  Pin,
  Share2,
  Sparkles,
  Users,
  Compass,
  TrendingUp,
  Award,
  ExternalLink,
  Flame,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Hash,
  ShieldCheck,
  Bot
} from 'lucide-react';
import { communityService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CommunityPost {
  id: string;
  user_id: string;
  channel: string;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  user_liked: boolean;
  created_at: string;
  author_name: string;
  author_avatar?: string | null;
  author_role?: string;
  author_package?: string | null;
  author_rank?: string | null;
  author_rank_color?: string | null;
}

interface CommentItem {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar?: string | null;
  author_role?: string;
  author_package?: string | null;
  author_rank?: string | null;
  author_rank_color?: string | null;
}

const CHANNELS = [
  { id: 'all', name_ar: 'جميع النقاشات', name_en: 'All Topics', icon: Compass },
  { id: 'general', name_ar: 'النقاش العام', name_en: 'General Discussion', icon: MessageSquare },
  { id: 'ai_automation', name_ar: 'أتمتة الذكاء الاصطناعي', name_en: 'AI Automation', icon: Bot },
  { id: 'ecommerce', name_ar: 'التجارة الإلكترونية', name_en: 'E-Commerce', icon: TrendingUp },
  { id: 'trading', name_ar: 'الكريبتو والتداول', name_en: 'Crypto & Trading', icon: Flame },
  { id: 'success_stories', name_ar: 'قصص النجاح والأرباح', name_en: 'Success Stories', icon: Award },
];

export default function StudentCommunity() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  // Create Post Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newChannel, setNewChannel] = useState('general');
  const [creating, setCreating] = useState(false);

  // Active Post Comments Dialog
  const [activePost, setActivePost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [selectedChannel, sortBy]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await communityService.getPosts({
        channel: selectedChannel === 'all' ? undefined : selectedChannel,
        sort: sortBy
      });
      setPosts(res.posts || []);
    } catch (err) {
      toast.error(isRtl ? 'فشل تحميل منشورات المجتمع' : 'Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      return toast.error(isRtl ? 'يرجى كتابة عنوان وتفاصيل المنشور' : 'Please provide title and content');
    }

    try {
      setCreating(true);
      const res = await communityService.createPost({
        channel: newChannel,
        title: newTitle.trim(),
        content: newContent.trim()
      });
      toast.success(isRtl ? 'تم نشر مشاركتك بنجاح في مجتمع رواد الأعمال!' : 'Post published successfully!');
      setIsCreateOpen(false);
      setNewTitle('');
      setNewContent('');
      loadPosts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || (isRtl ? 'فشل نشر المشاركة' : 'Failed to publish post'));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleLike = async (post: CommunityPost) => {
    // Optimistic toggle
    const prevLiked = post.user_liked;
    const prevLikes = post.likes_count;

    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          user_liked: !prevLiked,
          likes_count: prevLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1
        };
      }
      return p;
    }));

    if (activePost && activePost.id === post.id) {
      setActivePost(curr => curr ? {
        ...curr,
        user_liked: !prevLiked,
        likes_count: prevLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1
      } : null);
    }

    try {
      await communityService.toggleLike(post.id);
    } catch (err) {
      // Revert on error
      setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
          return { ...p, user_liked: prevLiked, likes_count: prevLikes };
        }
        return p;
      }));
    }
  };

  const handleOpenComments = async (post: CommunityPost) => {
    setActivePost(post);
    setComments([]);
    try {
      setLoadingComments(true);
      const res = await communityService.getComments(post.id);
      setComments(res.comments || []);
    } catch (err) {
      toast.error(isRtl ? 'فشل تحميل التعليقات' : 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !newCommentText.trim()) return;

    try {
      setSendingComment(true);
      const res = await communityService.addComment(activePost.id, { content: newCommentText.trim() });
      if (res.comment) {
        setComments(prev => [...prev, res.comment]);
        setPosts(prev => prev.map(p => p.id === activePost.id ? { ...p, comments_count: p.comments_count + 1 } : p));
        setActivePost(curr => curr ? { ...curr, comments_count: curr.comments_count + 1 } : null);
      }
      setNewCommentText('');
      toast.success(isRtl ? 'تم إضافة تعليقك' : 'Comment added');
    } catch (err: any) {
      toast.error(err.response?.data?.error || (isRtl ? 'فشل إضافة التعليق' : 'Failed to add comment'));
    } finally {
      setSendingComment(false);
    }
  };

  const getChannelBadge = (chId: string) => {
    const ch = CHANNELS.find(c => c.id === chId);
    return isRtl ? (ch?.name_ar || chId) : (ch?.name_en || chId);
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {/* Top Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-black">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Nextvora Official Community Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {isRtl ? 'مجتمع رواد الأعمال وقادة Nextvora' : 'Nextvora Leaders & Builders Community'}
              </h1>
              <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
                {isRtl
                  ? 'منصتك الموحدة لتبادل الخبرات، مناقشة مشاريع الذكاء الاصطناعي والتجارة الإلكترونية، والتواصل المباشر مع أعضاء وشبكة رواد الأعمال.'
                  : 'Your unified space to exchange insights, discuss AI automation projects, network, and grow your digital empire.'}
              </p>
            </div>

            <Button
              onClick={() => setIsCreateOpen(true)}
              className="rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black h-12 px-6 shadow-lg shadow-amber-500/20 gap-2 shrink-0"
            >
              <PlusCircle className="h-5 w-5" />
              <span>{isRtl ? 'إضافة منشور جديد' : 'New Discussion'}</span>
            </Button>
          </div>
        </div>

        {/* Channels & Filters Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Channel Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              const isActive = selectedChannel === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 scale-[1.02]'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{isRtl ? ch.name_ar : ch.name_en}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Switcher */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                sortBy === 'latest' ? 'bg-slate-100 dark:bg-slate-800 text-purple-600' : 'text-slate-500'
              }`}
            >
              {isRtl ? 'الأحدث' : 'Latest'}
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                sortBy === 'popular' ? 'bg-slate-100 dark:bg-slate-800 text-purple-600' : 'text-slate-500'
              }`}
            >
              {isRtl ? 'الأكثر تفاعلاً' : 'Popular'}
            </button>
          </div>
        </div>

        {/* Main Community Grid: Feed (Left/Center) + Sidebar (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed Column (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600 mb-3" />
                <p className="text-xs text-slate-400 font-medium">{isRtl ? 'جاري تحميل نقاشات المجتمع...' : 'Loading community feed...'}</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isRtl ? 'لا توجد منشورات في هذا القسم بعد' : 'No posts in this channel yet'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {isRtl ? 'كن أول من يشارك فكرة أو سؤالاً مفيداً لزملائك في المجتمع!' : 'Be the first to share an insight or question with the community!'}
                </p>
                <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl text-xs font-bold">
                  {isRtl ? 'ابدأ نقاشاً جديداً' : 'Start Discussion'}
                </Button>
              </div>
            ) : (
              posts.map((post) => (
                <Card
                  key={post.id}
                  className={`rounded-3xl border transition-all duration-200 overflow-hidden bg-white dark:bg-slate-900 ${
                    post.is_pinned
                      ? 'border-purple-300 dark:border-purple-800 shadow-md shadow-purple-500/5 ring-1 ring-purple-400/20'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Header: Author + Channel + Pin */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100 dark:border-slate-800 shadow-xs">
                          {post.author_avatar ? (
                            <AvatarImage src={post.author_avatar} alt={post.author_name} />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs">
                            {post.author_name ? post.author_name.slice(0, 2).toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                              {post.author_name}
                            </h4>
                            {post.author_rank && (
                              <span
                                className="text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-2xs"
                                style={{ backgroundColor: post.author_rank_color || '#7c3aed' }}
                              >
                                {post.author_rank}
                              </span>
                            )}
                            {post.author_package && !post.author_rank && (
                              <Badge variant="outline" className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {post.author_package}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(post.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {post.is_pinned && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-black">
                            <Pin className="h-3 w-3" />
                            <span>{isRtl ? 'مثبت' : 'Pinned'}</span>
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          #{getChannelBadge(post.channel)}
                        </span>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="space-y-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    {/* Footer Actions: Like, Comment, Share */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {/* Like Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleLike(post)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 ${
                            post.user_liked
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${post.user_liked ? 'fill-current text-rose-500' : ''}`} />
                          <span>{post.likes_count}</span>
                        </button>

                        {/* Comment Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenComments(post)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments_count} {isRtl ? 'تعليق' : 'Comments'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success(isRtl ? 'تم نسخ رابط المنشور!' : 'Post link copied!');
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={isRtl ? 'مشاركة المنشور' : 'Share'}
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Sidebar Column: VIP Channels & Community Info */}
          <div className="space-y-5">
            {/* VIP Official Telegram & Groups */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isRtl ? 'قنوات مجتمع Nextvora الرسمية' : 'Official VIP Channels'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isRtl ? 'انضم لقنوات التيليجرام والنقاشات المباشرة' : 'Join Telegram channels & live community discussions'}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <a
                  href="https://t.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 hover:scale-[1.02] transition-transform text-xs font-bold text-blue-700 dark:text-blue-300"
                >
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    <span>{isRtl ? 'قناة التحديثات على Telegram' : 'Official Telegram Channel'}</span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </a>

                <a
                  href="https://t.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 hover:scale-[1.02] transition-transform text-xs font-bold text-emerald-700 dark:text-emerald-300"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>{isRtl ? 'جروب نقاشات القادة VIP' : 'VIP Leaders Chat Group'}</span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </a>
              </div>
            </Card>

            {/* Community Values & Rules */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-xs">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                {isRtl ? 'ميثاق مجتمع Nextvora' : 'Community Guidelines'}
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? 'تبادل المعرفة ومساعدة الأعضاء الجدد في الفريق.' : 'Share actionable insights & support fellow members.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? 'التركيز على بناء المشاريع الرقمية والذكاء الاصطناعي.' : 'Focus on building digital projects & AI tools.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRtl ? 'الاحترام المتبادل وتجنب الإعلانات العشوائية خارج المنظومة.' : 'Mutual respect and no external spam.'}</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* --- Create Post Modal --- */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="w-[95vw] sm:max-w-lg rounded-3xl p-5 sm:p-6">
            <form onSubmit={handleCreatePost} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  {isRtl ? 'إنشاء منشور أو نقاش جديد' : 'Create New Discussion'}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {isRtl ? 'شارك أفكارك وتجاربك أو اطرح سؤالاً لمجتمع Nextvora' : 'Share your ideas or ask a question'}
                </DialogDescription>
              </DialogHeader>

              {/* Channel Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isRtl ? 'اختر قناة النقاش' : 'Select Channel'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CHANNELS.filter(c => c.id !== 'all').map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setNewChannel(ch.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 text-right rtl:text-right transition-colors ${
                        newChannel === ch.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <ch.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{isRtl ? ch.name_ar : ch.name_en}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isRtl ? 'عنوان المنشور' : 'Post Title'}
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={isRtl ? 'مثال: كيف أطلقت أول خدمة ذكاء اصطناعي بنجاح...' : 'e.g. How I launched my first AI automation service...'}
                  className="rounded-2xl text-xs sm:text-sm font-semibold"
                  required
                />
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isRtl ? 'محتوى وتفاصيل المنشور' : 'Content'}
                </label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={isRtl ? 'اكتب تفاصيل المشاركة هنا...' : 'Write your post content here...'}
                  rows={5}
                  className="rounded-2xl text-xs sm:text-sm leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-2xl text-xs"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 shadow-md shadow-purple-500/20"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>{isRtl ? 'نشر في المجتمع' : 'Publish'}</span>
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* --- Comments Dialog --- */}
        <Dialog open={Boolean(activePost)} onOpenChange={(open) => !open && setActivePost(null)}>
          <DialogContent className="w-[95vw] sm:max-w-xl max-h-[88vh] rounded-3xl p-0 flex flex-col overflow-hidden">
            {activePost && (
              <>
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-purple-600 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60">
                      #{getChannelBadge(activePost.channel)}
                    </span>
                    <h3 className="text-base font-black truncate">{activePost.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{activePost.content}</p>
                </div>

                {/* Comments List */}
                <div className="p-5 overflow-y-auto flex-1 space-y-3">
                  {loadingComments ? (
                    <div className="text-center py-8 text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-600" />
                      <span className="text-xs">{isRtl ? 'جاري تحميل التعليقات...' : 'Loading comments...'}</span>
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-8">
                      {isRtl ? 'لا توجد تعليقات بعد. كن أول من يعلق!' : 'No comments yet. Be the first to comment!'}
                    </p>
                  ) : (
                    comments.map((comm) => (
                      <div key={comm.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-[10px]">
                                {comm.author_name ? comm.author_name.slice(0, 2).toUpperCase() : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-slate-900 dark:text-white">{comm.author_name}</span>
                            {comm.author_rank && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded-full text-white"
                                style={{ backgroundColor: comm.author_rank_color || '#7c3aed' }}
                              >
                                {comm.author_rank}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comm.created_at).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pl-8 rtl:pr-8 rtl:pl-0">
                          {comm.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-2">
                  <Input
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder={isRtl ? 'اكتب تعليقك هنا...' : 'Write your comment...'}
                    className="rounded-2xl text-xs"
                    disabled={sendingComment}
                  />
                  <Button
                    type="submit"
                    disabled={sendingComment || !newCommentText.trim()}
                    className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white px-4 shrink-0"
                  >
                    {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
