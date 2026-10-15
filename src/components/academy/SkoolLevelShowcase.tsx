import React, { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Play, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Users, 
  ArrowRight, 
  Lock, 
  Unlock, 
  CreditCard, 
  Wallet, 
  Star, 
  Layers, 
  Check, 
  ShoppingBag, 
  Bot, 
  Code2, 
  MessageSquare,
  Award,
  Video,
  RefreshCw,
  Loader2,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { packageService, affiliateService } from '@/services/apiService';

interface SkoolLevelShowcaseProps {
  currentPackage?: any;
  onPackagePurchased?: () => void;
  adminIntroSettings?: {
    title?: string;
    description?: string;
    videoUrl?: string;
    author?: string;
    badge?: string;
    flowTitle?: string;
    flowVideoUrl?: string;
    flowBanner?: string;
    flowDesc?: string;
    growTitle?: string;
    growVideoUrl?: string;
    growBanner?: string;
    growDesc?: string;
    primeTitle?: string;
    primeVideoUrl?: string;
    primeBanner?: string;
    primeDesc?: string;
  };
}

export function SkoolLevelShowcase({
  currentPackage,
  onPackagePurchased,
  adminIntroSettings
}: SkoolLevelShowcaseProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

// Helpers for media URL formatting and playback
const isDirectVideoUrl = (url?: string) => {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.mkv') ||
    clean.endsWith('.avi') ||
    clean.includes('/uploads/')
  );
};

const formatVideoEmbedUrl = (url?: string) => {
  if (!url) return '';
  const clean = url.trim();
  // YouTube Shorts: https://youtube.com/shorts/VIDEO_ID
  const shortsMatch = clean.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1`;
  }
  // Standard YouTube watch: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = clean.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1`;
  }
  // Short youtu.be: https://youtu.be/VIDEO_ID
  const youtuMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (youtuMatch) {
    return `https://www.youtube.com/embed/${youtuMatch[1]}?autoplay=1`;
  }
  // Already embed
  if (clean.includes('youtube.com/embed/')) {
    return clean.includes('?') ? `${clean}&autoplay=1` : `${clean}?autoplay=1`;
  }
  // Vimeo
  const vimeoMatch = clean.match(/vimeo\.com\/([0-9]+)/);
  if (vimeoMatch && !clean.includes('player.vimeo.com')) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }
  return clean.includes('?') ? `${clean}&autoplay=1` : `${clean}?autoplay=1`;
};

  // Active Post Tab: 0 = Intro, 1 = FLOW, 2 = GROW, 3 = PRIME
  const [activeTab, setActiveTab] = useState<number>(0);

  // Selected media preview per post index (for image/video carousel)
  const [activeMediaIndex, setActiveMediaIndex] = useState<{ [key: number]: number }>({
    0: 0,
    1: 0,
    2: 0,
    3: 0,
  });

  // Video play state
  const [playingVideo, setPlayingVideo] = useState<{ [key: number]: boolean }>({
    0: false,
    1: false,
    2: false,
    3: false,
  });

  // Purchase Modal State
  const [packages, setPackages] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [selectedPostPkg, setSelectedPostPkg] = useState<any>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingPackages, setLoadingPackages] = useState<boolean>(true);

  // Check URL query parameters on mount e.g. ?post=1 or ?level=2
  useEffect(() => {
    loadData();
    const postParam = searchParams.get('post');
    const levelParam = searchParams.get('level');
    if (postParam !== null) {
      const idx = Number(postParam);
      if (idx >= 0 && idx <= 3) setActiveTab(idx);
    } else if (levelParam !== null) {
      const idx = Number(levelParam);
      if (idx >= 1 && idx <= 3) setActiveTab(idx);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoadingPackages(true);
      const [pkgsRes, walletRes] = await Promise.all([
        packageService.getAll(),
        affiliateService.getWallet().catch(() => ({ wallet: { balance: 0 } }))
      ]);
      setPackages(pkgsRes.packages || []);
      setWalletBalance(Number(walletRes?.wallet?.balance || 0));
    } catch (err) {
      console.error('[SkoolShowcase] Failed to load packages or wallet:', err);
    } finally {
      setLoadingPackages(false);
    }
  };

  // 4 Posts Data Definition
  const posts = [
    {
      id: 'post-intro',
      category: 'intro',
      type: 'intro',
      slug: 'intro',
      level: 0,
      tag: adminIntroSettings?.badge || (tr("فيديو تعريفي بالمشروع", "Project Overview Video")),
      tabLabel: tr("📌 فيديو تعريفي بالمشروع", "📌 Project Intro Video"),
      title: adminIntroSettings?.title || (tr("أكاديمية Nexyvora — فيديو تعريفي بالمشروع والرؤية", "Nexyvora Academy — Project & Vision Overview")),
      communityHandle: 'nexyvora.com/intro',
      author: adminIntroSettings?.author || (tr("إدارة Nexyvora", "Nexyvora Management")),
      date: tr("منشور مثبت من الإدارة", "Pinned by Management"),
      price: null,
      priceButtonText: tr("مشاهدة المستوى 1 (FLOW) الآن ←", "Explore Level 1 (FLOW) Now →"),
      duration: '4:20',
      membersCount: '2,850+',
      onlineCount: '412',
      adminCount: '1 Admin',
      bannerImage: adminIntroSettings?.introBanner || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
      videoUrl: adminIntroSettings?.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      mediaList: [
        {
          type: 'video',
          thumbnail: adminIntroSettings?.introBanner || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
          title: tr("الفيديو التعريفي الرئيسي", "Main Project Video"),
          duration: '4:20'
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
          title: tr("بيئة التعلم والمجتمع التفاعلي", "Interactive Community & Learning")
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
          title: tr("نظام النقاط والمحفظة والعمولات", "Points, Wallet & Commissions")
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
          title: tr("مرافقة المدربين والدعم الفني", "Mentor Support & Coaching")
        }
      ],
      description: adminIntroSettings?.description || (tr("مجتمع ودليل شامل لفهم مشروع وأكاديمية Nexyvora 🚀 تعلم مسارات البيزنس الرقمي والتسويق بالعمولة وكيف تبدأ رحلتك من الصفر.", "A comprehensive community and guide to Nexyvora Academy 🚀 Learn digital business pathways, affiliate marketing, and how to start your journey from scratch.")),
      curriculumHighlights: [
        {
          title: tr("رؤية المنصة والأكاديمية", "Platform & Academy Vision"),
          desc: tr("فهم فلسفة Nexyvora في دمج قوة الذكاء الاصطناعي مع الأعمال الرقمية والتسويق بالعمولة متعدد الأجيال.", "Understanding Nexyvora\\'s philosophy in integrating AI power with digital business and multi-generation affiliate marketing.")
        },
        {
          title: tr("المسار التدريجي ثلاثي المراحل", "3-Stage Progressive Pathway"),
          desc: tr("كيف تنتقل خطوة بخطوة من متجر إلكتروني ناجح (FLOW)، إلى وكالة أتمتة وذكاء اصطناعي (GROW)، وصولاً لبناء برمجيات SaaS متكاملة (PRIME).", "How to progress step by step from a successful e-commerce store (FLOW), to an AI automation agency (GROW), to building SaaS products (PRIME).")
        },
        {
          title: tr("نظام الأرباح والعمولات (5 أجيال)", "Commissions & Earnings System (5 Generations)"),
          desc: tr("شرح كيفية تفعيل رابط الإحالة، كسب عمولات فورية، وسحب أرباحك إلى بريدي موب أو USDT أو الحساب البنكي.", "How to activate your referral link, earn instant commissions, and withdraw your earnings via BaridiMob, USDT, or Bank transfer.")
        },
        {
          title: tr("المجتمع والشهادات المعتمدة", "Community & Certified Credentials"),
          desc: tr("التفاعل مع آلاف الطلاب والمشتركين، حضور الورش الأسبوعية على زوم والحصول على شهادات موثقة برمز QR.", "Engage with thousands of members, attend weekly live Zoom workshops, and receive verified QR certificates.")
        }
      ],
    },
    {
      id: 'post-level-1',
      category: 'flow',
      type: 'package',
      slug: 'flow-150',
      level: 1,
      tag: tr("المستوى 1 — الأكثر طلباً للمبتدئين", "Level 1 — Most Popular for Beginners"),
      tabLabel: tr("🛒 المستوى 1: FLOW (150$)", "🛒 Level 1: FLOW ($150)"),
      title: adminIntroSettings?.flowTitle || (tr("FLOW 150 $ — التجارة الإلكترونية والبيزنس الرقمي بالذكاء الاصطناعي", "FLOW $150 — AI E-Commerce & Digital Business")),
      communityHandle: 'nexyvora.com/flow',
      author: tr("مدربو مسار التجارة الإلكترونية · Nexyvora", "E-Commerce Instructors · Nexyvora"),
      date: tr("منهج 2026 المحدث بالذكاء الاصطناعي", "2026 AI-Updated Curriculum"),
      price: 150,
      priceButtonText: 'JOIN $150/year · ' + (tr("شراء وتفعيل", "Buy & Activate")),
      annualNotice: tr("اشتراك سنوي (صلاحية 365 يوماً مع تجديد وتفعيل تلقائي للحساب)", "Annual subscription (365 days access with automatic account activation)"),
      duration: '3:45',
      membersCount: '1,420+',
      onlineCount: '318',
      adminCount: '1 Admin',
      bannerImage: adminIntroSettings?.flowBanner || 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80',
      videoUrl: adminIntroSettings?.flowVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      mediaList: [
        {
          type: 'video',
          thumbnail: adminIntroSettings?.flowBanner || 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=600&q=80',
          title: tr("فيديو معاينة المستوى 1 (FLOW)", "Level 1 (FLOW) Preview Video"),
          duration: '3:45'
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
          title: tr("لوحة تحكم المتجر ومبيعات الـ COD", "Store Dashboard & COD Sales")
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
          title: tr("صناعة إعلانات TikTok & Reels بالـ AI", "Creating TikTok & Reels Ads with AI")
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
          title: tr("أبحاث المنتجات الرابحة وهوامش الربح", "Winning Product Research & Margins")
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=600&q=80',
          title: tr("نظام إدارة وتأكيد طلبيات الشحن السريع", "Fast Shipping & Order Confirmation")
        }
      ],
      description: adminIntroSettings?.flowDesc || (tr("مجتمع لتعلم التجارة الإلكترونية بالذكاء الاصطناعي خطوة بخطوة 🚀 وبناء متجرك الرابح بنظام الدفع عند الاستلام COD وإعلانات السوشيال ميديا.", "Community to learn AI-powered e-commerce step by step 🚀 Build your profitable store with cash-on-delivery (COD) and social ads.")),
      curriculumHighlights: [
        {
          title: tr("🛍️ إنشاء متجر احترافي فائق السرعة", "🛍️ Building Ultra-Fast Professional Stores"),
          desc: tr("بناء متجر إلكتروني متوافق مع الهواتف الذكية (Shopify / YouCan / WooCommerce) مجهز بالذكاء الاصطناعي لرفع معدل التحويل.", "Build mobile-responsive online stores (Shopify / YouCan / WooCommerce) optimized with AI to maximize conversion rates.")
        },
        {
          title: tr("🔍 أبحاث السوق واختيار المنتجات الرابحة (Winning Products)", "🔍 Market Research & Winning Products Selection"),
          desc: tr("طرق التجسس على الإعلانات الرابحة، تحليل المنافسين، واختيار منتجات ذات طلب مرتفع وهوامش ربح ممتازة.", "Methods to research viral ad creatives, analyze competitors, and pick high-demand products with healthy profit margins.")
        },
        {
          title: tr("🎨 صناعة الإعلانات وفيديوهات UGC بالذكاء الاصطناعي", "🎨 AI Ad Creatives & UGC Video Production"),
          desc: tr("توليد نصوص إعلانية وفيديوهات UGC مقنعة في دقائق بالاعتماد على Midjourney و CapCut و ElevenLabs و ChatGPT.", "Generate ad copy and high-converting UGC video hooks in minutes using Midjourney, CapCut, ElevenLabs, and ChatGPT.")
        },
        {
          title: tr("📊 إطلاق الحملات الإعلانية الممولة (Facebook, TikTok, Google Ads)", "📊 Launching Paid Ads (Facebook, TikTok, Google Ads)"),
          desc: tr("استراتيجيات استهداف دقيقة، قراءة وتحليل الإحصائيات (CPA, ROAS, CTR)، ومضاعفة الميزانية الرابحة (Scaling).", "Targeting strategies, metrics analysis (CPA, ROAS, CTR), and budget scaling for top-performing campaigns.")
        },
        {
          title: tr("⚙️ إدارة وتتبع الطلبيات والشحن والـ COD (الدفع عند الاستلام)", "⚙️ Order Confirmation, Shipping & COD Operations"),
          desc: tr("أنظمة تأكيد الطلبيات تلقائياً، تقليل نسبة الإرجاع (Return Rate)، والتعامل مع شركات التوصيل باحترافية.", "Automated order confirmation, return rate reduction, and managing delivery logistics smoothly.")
        },
        {
          title: tr("🤝 خدمة العملاء الآلية ورضا المستهلك", "🤝 Automated Customer Care & Buyer Satisfaction"),
          desc: tr("تجهيز بوتات ردود سريعة للواتساب وإنستغرام للرد الفوري على استفسارات الزبائن وإغلاق المبيعات.", "Deploy fast-reply WhatsApp and Instagram chatbots for instant customer responses and closing sales.")
        },
        {
          title: tr("📈 استراتيجيات مضاعفة المبيعات (Upselling & Cross-selling)", "📈 Upselling & Cross-selling Growth Playbook"),
          desc: tr("زيادة متوسط قيمة سلة الشراء (AOV) من خلال العروض التكميلية والباقات الترويجية الذكية.", "Increase average order value (AOV) through bundle deals, post-purchase offers, and complementary products.")
        },
        {
          title: tr("🔐 الإدارة المالية وإعادة استثمار الأرباح", "🔐 Financial Discipline & Profit Reinvestment"),
          desc: tr("إدارة التدفق النقدي بدقة، حساب صافي الأرباح، وفصل ميزانية العمل عن النفقات الشخصية لضمان النمو المستمر.", "Master cash flow management, calculate net profit, and separate personal finances from business capital.")
        }
      ],
      bonuses: [
        tr("🔓 فتح عمولات التسويق بالعمولة للجيل 1، 2، و 3", "🔓 Unlock affiliate commissions for Gen 1, 2, and 3"),
        tr("📁 قوالب متاجر جاهزة للاستخدام الفوري", "📁 Ready-made e-commerce store templates"),
        tr("📑 قائمة بأكثر من 100 نيتش ومنتج رابح جاهزة للإطلاق", "📑 Curated list of 100+ winning niches & products"),
        tr("💬 وصول لمجتمع تجار Nexyvora الخاص على مدار الساعة", "💬 24/7 access to Nexyvora private merchant community")
      ],
    },
    {
      id: 'post-level-2',
      category: 'grow',
      type: 'package',
      slug: 'grow-500',
      level: 2,
      tag: tr("المستوى 2 — قيمة استثنائية ونمو متسارع", "Level 2 — Exceptional Value & Rapid Growth"),
      tabLabel: tr("🤖 المستوى 2: GROW (500$)", "🤖 Level 2: GROW ($500)"),
      title: adminIntroSettings?.growTitle || (tr("GROW 500 $ — الذكاء الاصطناعي، الأتمتة ووكلاء AI (AI Automation)", "GROW $500 — AI, Automation & AI Agents (AAA)")),
      communityHandle: 'nexyvora.com/grow',
      author: tr("مهندسو الذكاء الاصطناعي والأتمتة · Nexyvora", "AI & Automation Engineers · Nexyvora"),
      date: tr("منهج وكلاء الذكاء الاصطناعي ونظم n8n", "AI Agents & n8n Workflows Curriculum"),
      price: 500,
      priceButtonText: 'JOIN $500/year · ' + (tr("شراء وتفعيل", "Buy & Activate")),
      annualNotice: tr("اشتراك سنوي (صلاحية 365 يوماً مع تجديد وتفعيل تلقائي للحساب)", "Annual subscription (365 days access with automatic account activation)"),
      duration: '4:15',
      membersCount: '890+',
      onlineCount: '215',
      adminCount: '1 Admin',
      bannerImage: adminIntroSettings?.growBanner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      videoUrl: adminIntroSettings?.growVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      mediaList: [
        {
          type: 'video',
          thumbnail: adminIntroSettings?.growBanner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
          title: tr("فيديو معاينة المستوى 2 (GROW)", "Level 2 (GROW) Preview Video"),
          duration: '4:15'
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
          title: tr("بناء سير العمل والأتمتة بواسطة n8n", "Building Automated Workflows with n8n")
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
          title: tr("شات بوتات مبيعات الواتساب الذكية", "AI WhatsApp Sales Bots")
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
          title: tr("ربط الـ CRMs وقواعد بيانات العملاء", "Connecting CRMs & Customer Databases")
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
          title: tr("نموذج عمل وكالة أتمتة الذكاء الاصطناعي (AAA)", "AI Automation Agency (AAA) Business Model")
        }
      ],
      description: adminIntroSettings?.growDesc || (tr("مجتمع لبناء وتدريب وكلاء الذكاء الاصطناعي (Custom AI Agents) وأنظمة الأتمتة عبر n8n 🚀 وإطلاق وكالة أتمتة AI للشركات.", "Community to build custom AI agents and automate business operations with n8n 🚀 Launch your AI Automation Agency (AAA).")),
      curriculumHighlights: [
        {
          title: tr("🧠 أسس الذكاء الاصطناعي وهندسة الأوامر المتقدمة (Prompt Engineering)", "🧠 AI Foundations & Advanced Prompt Engineering"),
          desc: tr("إتقان صياغة التوجيهات الدقيقة لنماذج LLM المتطورة (GPT-4o, Claude 3.5 Sonnet, Gemini Pro) لأتمتة المهام المعقدة.", "Master prompt engineering with modern LLMs (GPT-4o, Claude 3.5 Sonnet, Gemini Pro) for high-complexity workflows.")
        },
        {
          title: tr("🔄 أتمتة العمليات وسير العمل بدون برمجة (n8n, Make, Zapier)", "🔄 No-Code & Low-Code Automations (n8n, Make, Zapier)"),
          desc: tr("بناء سيناريوهات أتمتة ذكية تربط التطبيقات والمنصات لإلغاء المهام اليدوية بنسبة 100% وتحسين الكفاءة التشغيلية.", "Build workflows interconnecting apps and services to eliminate repetitive tasks and scale operational efficiency.")
        },
        {
          title: tr("🤖 بناء وتدريب وكلاء الذكاء الاصطناعي المتخصصين (Custom AI Agents)", "🤖 Custom AI Agents Development & Training"),
          desc: tr("إنشاء وكلاء ذاتيي التصرف (Autonomous Agents) لأبحاث السوق، تصفية المرشحين، وصناعة المحتوى التلقائي.", "Create autonomous agents for automated market research, lead qualification, and hands-free content creation.")
        },
        {
          title: tr("💬 تطوير شات بوت ذكي للمبيعات وخدمة العملاء على واتساب", "💬 WhatsApp AI Chatbots for Sales & Support"),
          desc: tr("دمج وكلاء محادثة يفهمون منتجاتك، يجيبون بالصوت والنص، ويتممون الطلبيات مباشرة عبر واتساب وفيسبوك.", "Deploy conversational bots that know your inventory, respond via text/voice, and complete checkouts in chat.")
        },
        {
          title: tr("🔗 ربط أنظمة الذكاء الاصطناعي مع قواعد البيانات و CRM و Google Sheets", "🔗 Database & CRM Integration (Airtable, Sheets, Notion)"),
          desc: tr("سحب وتحديث وتخزين بيانات العملاء والمبيعات في الوقت الفعلي داخل Notion و Airtable و Google Sheets.", "Real-time synchronization of customer records and transactions into Notion, Airtable, and Google Sheets.")
        },
        {
          title: tr("🛠️ أتمتة مهام السوشيال ميديا وصناعة المحتوى التلقائي", "🛠️ Autonomous Social Media Content Pipelines"),
          desc: tr("إنشاء خط إنتاج محتوى آلي يكتب المنشورات، يصمم الصور، ويجدول النشر التلقائي عبر مختلف المنصات دون تدخل بشري.", "Automated pipelines that research, draft, design, and schedule posts across multiple platforms autonomously.")
        },
        {
          title: tr("💼 إطلاق وكالة أتمتة ذكاء اصطناعي (AI Automation Agency - AAA)", "💼 Launching an AI Automation Agency (AAA)"),
          desc: tr("بناء باقات خدمات الأتمتة، تحديد الأسعار، استهداف الشركات والمصانع والمتاجر، وإقناعهم بعقود اشتراك شهرية متكررة (Retainers).", "Package service offerings, price retainer agreements, pitch B2B clients, and build recurring monthly revenue.")
        },
        {
          title: tr("📑 تسعير خدمات الأتمتة وصياغة العقود واتفاقيات العمل", "📑 Contract Templates & Value-Based Pricing"),
          desc: tr("نماذج عقود قانونية جاهزة، استراتيجيات التسعير حسب القيمة، وكيفية إغلاق صفقات بقيمة تبدأ من 500$ إلى 3000$ لكل عميل.", "Legal contract templates, value pricing models, and closing $500–$3,000+ client proposals.")
        }
      ],
      bonuses: [
        tr("✨ يشمل بالكامل كافة محتويات المستوى 1 (FLOW)", "✨ Includes full access to Level 1 (FLOW)"),
        tr("🔓 فتح عمولات التسويق بالعمولة للجيل 1، 2، 3، و 4", "🔓 Unlock affiliate commissions for Gen 1, 2, 3, and 4"),
        tr("📦 أكثر من 20 سيناريو جاهز ومجرب على n8n و Make قابلة للاستيراد بنقرة زر", "📦 20+ production-ready n8n & Make blueprints ready to import"),
        tr("📞 ورش عمل مباشرة أسبوعية لمراجعة سير العمل الخاص بك", "📞 Weekly live implementation workshops & workflow audits")
      ],
    },
    {
      id: 'post-level-3',
      category: 'saas',
      type: 'package',
      slug: 'prime-1000',
      level: 3,
      tag: tr("المستوى 3 — VIP النخبة وبناء الـ SaaS والمرافقة", "Level 3 — Elite VIP, SaaS Incubator & Mentorship"),
      tabLabel: tr("💻 المستوى 3: PRIME (1000$)", "💻 Level 3: PRIME ($1000)"),
      title: adminIntroSettings?.primeTitle || (tr("PRIME 1000 $ — البرمجة المتقدمة، بناء SaaS والمرافقة الشخصية 1-on-1", "PRIME $1000 — Full-Stack SaaS & 1-on-1 Mentorship")),
      communityHandle: 'nexyvora.com/prime',
      author: tr("كبار المطورين ورواد الأعمال المؤسسين · Nexyvora", "Senior Developers & Founders · Nexyvora"),
      date: tr("برنامج بناء المشاريع البرمجية والمرافقة الفردية", "Software Incubation & Dedicated Mentorship"),
      price: 1000,
      priceButtonText: 'JOIN $1000/year · ' + (tr("شراء وتفعيل", "Buy & Activate")),
      annualNotice: tr("اشتراك سنوي (صلاحية 365 يوماً مع تجديد وتفعيل تلقائي للحساب)", "Annual subscription (365 days access with automatic account activation)"),
      duration: '5:10',
      membersCount: '340+',
      onlineCount: '94',
      adminCount: '1 Admin',
      bannerImage: adminIntroSettings?.primeBanner || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      videoUrl: adminIntroSettings?.primeVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      mediaList: [
        {
          type: 'video',
          thumbnail: adminIntroSettings?.primeBanner || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
          title: tr("فيديو معاينة المستوى 3 (PRIME)", "Level 3 (PRIME) Preview Video"),
          duration: '5:10'
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
          title: tr("تطوير تطبيقات الـ SaaS بواسطة React & Next.js", "Building SaaS Apps with React & Next.js")
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
          title: tr("لوحات تحكم الاشتراكات وبوابات الدفع Stripe", "Subscription Dashboards & Stripe Billing")
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
          title: tr("جلسات المرافقة الشخصية 1-on-1 مع المؤسسين", "Dedicated 1-on-1 Founder Mentorship")
        },
        {
          type: 'image',
          thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
          title: tr("دمج الـ APIs والنشر السحابي على Vercel و AWS", "Cloud Deployments on Vercel & AWS")
        }
      ],
      description: tr("مجتمع VIP لتطوير تطبيقات الـ SaaS والبرمجة بالذكاء الاصطناعي 🚀 مع مرافقة استشارية شخصية 1-on-1 مع مؤسسي المنصة لتطوير مشروعك.", "Elite VIP incubator for building AI-powered SaaS apps 🚀 with dedicated 1-on-1 mentorship from Nexyvora founders."),
      curriculumHighlights: [
        {
          title: tr("💻 تطوير تطبيقات الويب الحديثة المتكاملة (Full-Stack Web Dev)", "💻 Modern Full-Stack Web Development"),
          desc: tr("إتقان React، Next.js، Node.js، Tailwind CSS، و TypeScript لبناء تطبيقات ويب سريعة جداً وقابلة للتوسع.", "Master React, Next.js, Node.js, Tailwind CSS, and TypeScript to engineer scalable web applications.")
        },
        {
          title: tr("🧩 بناء منصات وتطبيقات البرمجيات كخدمة (SaaS) من الفكرة حتى الإطلاق", "🧩 End-to-End SaaS Architecture & Launch"),
          desc: tr("دراسة جدوى الفكرة، تصميم واجهات المستخدم UI/UX التفاعلية، بناء قاعدة البيانات، ونظام الصلاحيات وتوثيق الحسابات (Auth).", "Validate concepts, craft modern UI/UX, architect robust database schemas, and integrate auth & RBAC.")
        },
        {
          title: tr("🔌 دمج واجهات برمجة التطبيقات للذكاء الاصطناعي (AI APIs)", "🔌 AI APIs & LLM Integration (OpenAI, Claude, Gemini)"),
          desc: tr("تضمين نماذج OpenAI، Anthropic، و Google Studio في تطبيقك لتقديم ميزات ذكاء اصطناعي حصرية يدفع مقابلها المستخدمون.", "Integrate OpenAI, Anthropic, and Google Gemini APIs into your SaaS to power monetization features.")
        },
        {
          title: tr("💳 ربط بوابات الدفع العالمية والاشتراكات المتكررة (Stripe, PayPal)", "💳 Recurring Billing & Global Gateways (Stripe, PayPal)"),
          desc: tr("إعداد خطط الاشتراك الشهرية والسنوية، معالجة الدفع التلقائي، إدارة الفواتير، ونظام الحماية من الاحتيال.", "Configure recurring subscription tiers, webhooks, automated invoice management, and fraud protection.")
        },
        {
          title: tr("🚀 نشر وإدارة التطبيقات السحابية والحماية وقواعد البيانات", "🚀 Cloud Deployments, Security & Scalability"),
          desc: tr("استضافة الـ SaaS على Vercel و AWS و Supabase و Cloudflare مع أفضل معايير الأمان والتشفير.", "Host and scale software on Vercel, AWS, Supabase, and Cloudflare following enterprise security best practices.")
        },
        {
          title: tr("🎯 استراتيجيات التسويق واكتساب أول 100 عميل مدفوع للـ SaaS", "🎯 Go-to-Market & First 100 Paid SaaS Users"),
          desc: tr("طرق الإطلاق على Product Hunt و Reddit و LinkedIn، واستراتيجيات الـ Cold Email والنمو العضوي السريع.", "Proven Product Hunt, Reddit, and LinkedIn launch playbooks combined with cold outbound and organic loops.")
        },
        {
          title: tr("👨‍🏫 مرافقة استشارية شخصية 1-on-1 مع خبراء المنصة", "👨‍🏫 1-on-1 Executive Mentorship Sessions"),
          desc: tr("جلستان استشاريتان مخصصتان لك شهرياً لمراجعة الكود، تحسين واجهة المستخدم، وتوجيه استراتيجية المبيعات والتسويق لمشروعك.", "Dedicated monthly 1-on-1 advisory sessions covering code audits, UX feedback, and sales go-to-market.")
        },
        {
          title: tr("🤝 فرصة الحصول على تمويل وشراكة مباشرة لمشروعك", "🤝 Investment & Incubation Opportunities"),
          desc: tr("إمكانية عرض مشروعك الواعد على شبكة مستثمري Nexyvora والحصول على تمويل أو شراكة استراتيجية لتسريع نجاحك.", "Pitch promising projects to Nexyvora investor network for angel funding and strategic partnerships.")
        }
      ],
      bonuses: [
        tr("👑 يشمل بالكامل كافة محتويات المستويين 1 و 2 (FLOW + GROW)", "👑 Full access to both Level 1 & Level 2 (FLOW + GROW)"),
        tr("🔓 فتح عمولات التسويق بالعمولة لكافة الأجيال الخمسة (من الجيل 1 حتى 5)", "🔓 Unlock affiliate commissions across all 5 generations"),
        tr("📁 مكتبة أكواد SaaS جاهزة (Boilerplates) توفر عليك شهوراً من العمل", "📁 Production-grade SaaS boilerplates saving months of dev time"),
        tr("💎 دعم فني ذو أولوية قصوى ومباشرة مع كبار المطورين", "💎 Direct VIP priority support with lead platform engineers")
      ],
    }
  ];

  const currentPost = posts[activeTab] || posts[0];
  const currentMediaIdx = activeMediaIndex[activeTab] || 0;
  const currentMedia = currentPost.mediaList[currentMediaIdx] || currentPost.mediaList[0];
  const isVideoActive = currentMedia.type === 'video';
  const isOwned = currentPackage && currentPost.level > 0 && currentPackage.level >= currentPost.level + 1;

  // Helper to open purchase modal for a level
  const handleOpenBuyModal = (postItem: any) => {
    const pkg = packages.find(p => p.slug === postItem.slug || p.level === postItem.level + 1);
    if (pkg) {
      setSelectedPostPkg(pkg);
    } else {
      setSelectedPostPkg({
        id: postItem.slug,
        name: postItem.slug.toUpperCase(),
        name_ar: postItem.title.split('—')[0].trim(),
        price: postItem.price,
        level: postItem.level + 1
      });
    }
    setPaymentMethod('wallet');
    setPaymentRef('');
    setIsBuyModalOpen(true);
  };

  // Helper to calculate price considering upgrade
  const getUpgradePrice = (targetPkg: any) => {
    if (!targetPkg) return 0;
    const targetPrice = Number(targetPkg.price || 0);
    if (!currentPackage) return targetPrice;
    if (targetPkg.level > currentPackage.level) {
      const curPrice = Number(currentPackage.package_original_price || currentPackage.price || 0);
      return Math.max(0, targetPrice - curPrice);
    }
    return targetPrice;
  };

  const requiredAmount = selectedPostPkg ? getUpgradePrice(selectedPostPkg) : 0;
  const canPayWallet = walletBalance >= requiredAmount;

  // Handle Purchase Confirmation
  const handleConfirmPurchase = async () => {
    if (!selectedPostPkg) return;

    if (paymentMethod === 'wallet' && !canPayWallet) {
      toast.error(tr("رصيد المحفظة غير كافٍ لإتمام عملية الشراء السنوية", "Insufficient wallet balance for annual purchase"));
      return;
    }

    try {
      setSubmitting(true);
      const realPkg = packages.find(p => p.slug === selectedPostPkg.slug || p.id === selectedPostPkg.id || p.level === selectedPostPkg.level);
      const pkgId = realPkg?.id || selectedPostPkg.id;

      const res = await packageService.purchaseOrUpgrade({
        packageId: pkgId,
        paymentMethod,
        paymentReference: paymentMethod === 'wallet' ? `WALLET-${Date.now()}` : (paymentRef || `MANUAL-${Date.now()}`)
      });

      toast.success(res.message || (tr("تمت عملية الشراء وتفعيل اشتراكك السنوي ومقرراتك بنجاح!", "Annual subscription and courses activated successfully!")));
      setIsBuyModalOpen(false);
      if (onPackagePurchased) {
        onPackagePurchased();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || (tr("فشلت معالجة عملية الشراء", "Purchase processing failed")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 4 Clean Tabs at the top to switch between Posts (Skool Community Switcher) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {posts.map((postItem, idx) => {
          const isActive = activeTab === idx;
          const isItemOwned = currentPackage && postItem.level > 0 && currentPackage.level >= postItem.level + 1;
          return (
            <button
              key={postItem.id}
              onClick={() => {
                setActiveTab(idx);
                setPlayingVideo(prev => ({ ...prev, [idx]: false }));
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>{postItem.tabLabel}</span>
              {isItemOwned && (
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500 text-white rounded-full">
                  {tr("مفعل", "Active")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Clean Heading (Exact Skool Style like Image 2) */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          {currentPost.title}
        </h1>
        {isOwned && (
          <Badge className="bg-emerald-500 text-white text-xs px-3 py-1 font-bold flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> {tr("باقة مفعلة في حسابك", "Active Package")}
          </Badge>
        )}
      </div>

      {/* Skool Exact Two-Column About Page Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 16:9 Video Player + Thumbnails Strip + Meta Row + Curriculum */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Video Container (Exact Skool Styling) */}
          <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm relative group">
            {isVideoActive ? (
              <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                {playingVideo[activeTab] ? (
                  isDirectVideoUrl(currentPost.videoUrl) ? (
                    <video
                      src={currentPost.videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <iframe
                      src={formatVideoEmbedUrl(currentPost.videoUrl)}
                      title={currentPost.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )
                ) : (
                  <div 
                    className="relative w-full h-full flex items-center justify-center cursor-pointer select-none"
                    onClick={() => setPlayingVideo(prev => ({ ...prev, [activeTab]: true }))}
                  >
                    <img 
                      src={currentMedia.thumbnail || currentPost.bannerImage} 
                      alt={currentMedia.title}
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors" />

                    {/* Classic Skool/YouTube Centered Play Button (Dark Rounded Rectangle with White Triangle) */}
                    <div className="relative z-10 w-16 h-11 md:w-20 md:h-14 rounded-2xl bg-black/75 hover:bg-black/90 text-white flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105">
                      <Play className="h-6 w-6 md:h-7 md:w-7 fill-white translate-x-0.5" />
                    </div>

                    {/* Skool Duration Badge in Bottom Right Corner */}
                    <div className="absolute bottom-3 right-3 z-10">
                      <span className="text-[11px] font-mono font-bold text-white bg-black/80 px-2 py-0.5 rounded shadow-sm">
                        {currentPost.duration}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                <img 
                  src={currentMedia.thumbnail} 
                  alt={currentMedia.title}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-4 text-white">
                  <span className="font-bold text-sm md:text-base">{currentMedia.title}</span>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnails Strip (Exact Skool Style like Image 2) */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {currentPost.mediaList.map((media, mIdx) => {
              const isSelected = currentMediaIdx === mIdx;
              return (
                <button
                  key={mIdx}
                  onClick={() => {
                    setActiveMediaIndex(prev => ({ ...prev, [activeTab]: mIdx }));
                    if (media.type !== 'video') {
                      setPlayingVideo(prev => ({ ...prev, [activeTab]: false }));
                    }
                  }}
                  className={`relative shrink-0 w-24 h-16 md:w-28 md:h-18 rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected 
                      ? 'border-amber-400 ring-2 ring-amber-400/40 opacity-100 scale-102' 
                      : 'border-slate-300 dark:border-slate-700 opacity-75 hover:opacity-100 hover:border-slate-400'
                  }`}
                >
                  <img 
                    src={media.thumbnail} 
                    alt={media.title} 
                    className="w-full h-full object-cover"
                  />
                  {media.type === 'video' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-md bg-black/70 text-white flex items-center justify-center">
                        <Play className="h-3 w-3 fill-white ml-0.5" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Exact Skool Meta Bar Under Thumbnails (Image 2 Footer) */}
          <div className="flex flex-wrap items-center gap-6 py-3 border-y border-slate-200 dark:border-slate-800 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-slate-400" />
              {currentPost.price 
                ? (tr("مجتمع تدريبي خاص", "Private Training Community")) 
                : (tr("مفتوح للجميع", "Open to All"))}
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Users className="h-4 w-4 text-slate-400" />
              {currentPost.membersCount} {tr("عضو", "Members")}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-amber-600 dark:text-amber-400 font-bold">
              <CreditCard className="h-4 w-4" />
              {currentPost.price ? `$${currentPost.price} / ${tr("سنوياً", "year")}` : (tr("مجاناً", "Free"))}
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-slate-400" />
              {tr("بواسطة", "By")} {currentPost.author}
            </span>
          </div>

          {/* Detailed Curriculum Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  {tr("المحاور والمنهج التفصيلي الكامل", "Comprehensive Curriculum & Outline")}
                </h3>
                <p className="text-xs text-slate-400">
                  {tr("جميع المهارات والأدوات والتطبيقات المشمولة في هذا المستوى", "All skills, tools, and workflows included in this level")}
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {currentPost.curriculumHighlights.length} {tr("محاور رئيسية", "Core Modules")}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPost.curriculumHighlights.map((item, cIdx) => (
                <div 
                  key={cIdx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 hover:border-primary/40 transition-colors"
                >
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item.title}</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pr-6">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Additional Bonuses for Levels */}
            {currentPost.bonuses && (
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2.5">
                <span className="font-bold text-xs md:text-sm text-primary flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  {tr("مزايا ومكافآت إضافية تشملها هذه الباقة:", "Exclusive Perks & Bonuses Included:")}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                  {currentPost.bonuses.map((bonus, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{bonus}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Sidebar Card (Exact Skool Style like Image 2) */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
            {/* Top Cover Image with Golden Ribbon */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
              <img 
                src={currentPost.bannerImage} 
                alt={currentPost.title}
                className="w-full h-full object-cover" 
              />
              {/* Powered by Nexyvora Ribbon in top right corner (like Skool in Image 2) */}
              <div className="absolute top-3 left-3 bg-[#fcd34d] text-slate-950 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm">
                Powered by Nexyvora
              </div>
            </div>

            <CardContent className="p-5 space-y-5">
              {/* Title & URL Handle */}
              <div className="space-y-1">
                <h3 className="font-black text-lg text-slate-900 dark:text-white leading-snug">
                  {currentPost.title.split('—')[0]}
                </h3>
                <span className="font-mono text-xs text-slate-400 block truncate" dir="ltr">
                  {currentPost.communityHandle}
                </span>
              </div>

              {/* 2-3 Lines Description */}
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentPost.description}
              </p>

              {/* Exact Skool 3-Column Stats Row (Image 2) */}
              <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-200 dark:divide-slate-800 text-center py-3 border-y border-slate-200 dark:border-slate-800">
                <div className="px-2">
                  <span className="font-black text-base md:text-lg text-slate-900 dark:text-white block font-mono">
                    {currentPost.membersCount.replace('+', '')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Members</span>
                </div>
                <div className="px-2">
                  <span className="font-black text-base md:text-lg text-slate-900 dark:text-white block font-mono">
                    {currentPost.onlineCount}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Online</span>
                </div>
                <div className="px-2">
                  <span className="font-black text-base md:text-lg text-slate-900 dark:text-white block font-mono">
                    {currentPost.adminCount}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Role</span>
                </div>
              </div>

              {/* Big Golden Skool CTA Button (Exact styling from Image 2: JOIN $.../month / year) */}
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    if (currentPost.price && currentPost.slug) {
                      navigate(`/student/packages?buy=${currentPost.slug}`);
                    } else {
                      setActiveTab(1);
                    }
                  }}
                  className="w-full py-6 text-sm md:text-base font-extrabold rounded-lg bg-[#fcd34d] hover:bg-[#fbbf24] text-slate-950 shadow-sm border border-amber-300 transition-all hover:shadow-md cursor-pointer"
                >
                  {currentPost.price 
                    ? (tr("تأكيد وتفعيل الباقة السنوية ($${currentPost.price} / سنوياً)", "Confirm & Activate Annual Plan ($${currentPost.price}/year)")) 
                    : (tr("مشاهدة المستوى 1 (FLOW) الآن ←", "Explore Level 1 (FLOW) Now →"))}
                </Button>

                {currentPost.price && (
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/student/packages?buy=${currentPost.slug}`)}
                    className="w-full text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white h-8"
                  >
                    {tr("عرض صفحة الباقات وجدول المقارنة الكامل", "View all packages & comparison table")}
                    <ArrowRight className="h-3.5 w-3.5 mr-1 rtl:rotate-180" />
                  </Button>
                )}
              </div>

              {/* Annual Notice */}
              {currentPost.annualNotice && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold block">
                    {currentPost.annualNotice}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Direct Quick Purchase & Activation Dialog */}
      <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className={isRtl ? "text-right" : "text-left"}>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Zap className="h-5 w-5 text-amber-500" />
              {tr("تأكيد وتفعيل الباقة السنوية", "Confirm & Activate Annual Plan")}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {tr("اختر طريقة الدفع المناسبة لتفعيل باقتك لمدة سنة كاملة وتلقائياً.", "Select payment method to activate your 1-year access.")}
            </DialogDescription>
          </DialogHeader>

          {selectedPostPkg && (
            <div className="space-y-4 py-3">
              {/* Package Summary */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">{tr("الباقة المختارة:", "Selected Package:")}</span>
                  <span className="font-bold text-base text-slate-900 dark:text-white">
                    {isRtl ? (selectedPostPkg.name_ar || selectedPostPkg.name) : (selectedPostPkg.name || selectedPostPkg.name_ar)}
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                    {tr("صلاحية الاشتراك: سنة كاملة (365 يوماً)", "Validity: 1 Full Year (365 days)")}
                  </span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-2xl font-black text-primary">
                    ${requiredAmount}
                  </span>
                  <span className="text-xs text-slate-400 block">{tr("USD / سنوياً", "USD / year")}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tr("اختر وسيلة الدفع:", "Select Payment Method:")}
                </Label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-xl border text-right rtl:text-right ltr:text-left transition-all ${
                      paymentMethod === 'wallet'
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Wallet className="h-4 w-4" />
                      <span>{tr("رصيد المحفظة", "Wallet Balance")}</span>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-600 block">
                      ${walletBalance.toFixed(2)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('baridimob')}
                    className={`p-3 rounded-xl border text-right rtl:text-right ltr:text-left transition-all ${
                      paymentMethod === 'baridimob'
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <CreditCard className="h-4 w-4" />
                      <span>BaridiMob / CCP</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      {tr("تحويل محلي سريع", "Fast Local Transfer")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('crypto')}
                    className={`p-3 rounded-xl border text-right rtl:text-right ltr:text-left transition-all ${
                      paymentMethod === 'crypto'
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap className="h-4 w-4" />
                      <span>USDT (TRC20)</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      {tr("دفع كريبتو فوري", "Instant Crypto")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-3 rounded-xl border text-right rtl:text-right ltr:text-left transition-all ${
                      paymentMethod === 'paypal'
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <CreditCard className="h-4 w-4" />
                      <span>PayPal</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      {tr("دفع دولي آمن", "Secure International")}
                    </span>
                  </button>
                </div>
              </div>

              {/* Payment Details / Notice based on method */}
              {paymentMethod === 'wallet' ? (
                <div className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                  canPayWallet 
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  <span>
                    {canPayWallet 
                      ? (tr("رصيد محفظتك كافٍ للتفعيل الفوري التلقائي!", "Your wallet balance is sufficient for instant activation!")) 
                      : (tr("رصيدك ($${walletBalance.toFixed(2)}) غير كافٍ لتغطية المبلغ المطلوب ($${requiredAmount}).", "Your balance ($${walletBalance.toFixed(2)}) is insufficient for required amount ($${requiredAmount})."))}
                  </span>
                  {!canPayWallet && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => navigate('/student/wallet')}
                      className="text-[11px] h-7 font-bold border-rose-300 text-rose-600 hover:bg-rose-50"
                    >
                      {tr("شحن المحفظة", "Top up")}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600 dark:text-slate-400">
                    {tr("رقم أو مرجع الحوالة (Payment Reference / Transaction ID):", "Payment Reference / Transaction ID:")}
                  </Label>
                  <Input
                    placeholder="e.g. REF-982347293"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400">
                    {tr("أدخل رقم العملية لتأكيد التحويل ومطابقته بواسطة النظام والإدارة.", "Enter transaction ID for system verification.")}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsBuyModalOpen(false)}
              className="text-xs rounded-xl"
            >
              {tr("إلغاء", "Cancel")}
            </Button>
            <Button
              onClick={() => {
                setIsBuyModalOpen(false);
                navigate(`/student/packages?buy=${selectedPostPkg?.slug || currentPost.slug}`);
              }}
              className="text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-white cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 ml-1" />
              {tr("تأكيد وتفعيل الباقة السنوية (الانتقال لصفحة الباقات)", "Confirm & Proceed to Packages")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
