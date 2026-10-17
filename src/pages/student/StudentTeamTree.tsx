import React, { useState, useEffect, useMemo, useRef } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { affiliateService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Network, 
  Search, 
  Users, 
  UserCheck,
  ShieldCheck, 
  Award, 
  Trophy, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Copy, 
  Check, 
  Layers, 
  Sparkles, 
  Plus, 
  Minus,
  User,
  Calendar,
  ChevronRight,
  Maximize2,
  Minimize2,
  Loader2,
  Share2,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

// Color palette and commission rates for the 10 Generations Matching Bonus in Nexyvora
const GENERATION_CONFIG = [
  { gen: 1, rate: '5%', color: 'bg-violet-600' },
  { gen: 2, rate: '4%', color: 'bg-cyan-500' },
  { gen: 3, rate: '3%', color: 'bg-emerald-500' },
  { gen: 4, rate: '2%', color: 'bg-amber-500' },
  { gen: 5, rate: '1%', color: 'bg-orange-500' },
  { gen: 6, rate: '1%', color: 'bg-purple-500' },
  { gen: 7, rate: '1%', color: 'bg-pink-500' },
  { gen: 8, rate: '0.5%', color: 'bg-rose-500' },
  { gen: 9, rate: '0.5%', color: 'bg-indigo-500' },
  { gen: 10, rate: '0.5%', color: 'bg-violet-500' },
];

interface TreeNodeData {
  id: string;
  name: string;
  email: string;
  affiliate_code?: string;
  referrer_id?: string | null;
  created_at?: string;
  avatar_url?: string | null;
  package_name?: string | null;
  package_name_en?: string | null;
  package_level?: number | null;
  package_status?: string | null;
  rank_name?: string | null;
  rank_name_ar?: string | null;
  rank_color?: string | null;
  kyc_status?: string | null;
  phone?: string | null;
  children: TreeNodeData[];
  directCount?: number;
  teamCount?: number;
  isCurrentUserRoot?: boolean;
}

// -------------------------------------------------------------
// RECURSIVE TOP-DOWN TREE NODE COMPONENT ("واحد تحت الأخر")
// -------------------------------------------------------------
interface VisualTreeNodeProps {
  node: TreeNodeData;
  level: number;
  expandedMap: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  onSelectNode: (node: TreeNodeData) => void;
  selectedNodeId?: string;
  highlightTerm?: string;
}

function VisualTreeNode({
  node,
  level,
  expandedMap,
  onToggleExpand,
  onSelectNode,
  selectedNodeId,
  highlightTerm
}: VisualTreeNodeProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedMap[node.id] !== false; // Default expanded unless collapsed
  const isSelected = selectedNodeId === node.id;

  const isMatched = useMemo(() => {
    if (!highlightTerm || !highlightTerm.trim()) return false;
    const term = highlightTerm.toLowerCase();
    return (
      node.name?.toLowerCase().includes(term) ||
      node.email?.toLowerCase().includes(term) ||
      node.affiliate_code?.toLowerCase().includes(term)
    );
  }, [node, highlightTerm]);

  // Initials
  const initials = useMemo(() => {
    if (!node.name) return 'U';
    const parts = node.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return node.name.slice(0, 2).toUpperCase();
  }, [node]);

  const displayRank = isRtl 
    ? (node.rank_name_ar || node.rank_name || node.package_name || 'عضو') 
    : (node.rank_name || node.package_name_en || 'MEMBER');
  
  const username = node.affiliate_code 
    ? `@${node.affiliate_code.toLowerCase()}` 
    : `@${node.email.split('@')[0]}`;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div 
        onClick={() => onSelectNode(node)}
        className={`flex flex-col items-center cursor-pointer group transition-all duration-200 select-none p-2 rounded-2xl ${
          isSelected 
            ? 'ring-2 ring-primary bg-primary/5' 
            : isMatched
            ? 'ring-2 ring-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
        }`}
      >
        {/* Circular Avatar with purple ring & status indicators */}
        <div className="relative">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 ${
            node.isCurrentUserRoot 
              ? 'border-purple-500 bg-gradient-to-tr from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-purple-950 shadow-md shadow-purple-500/20 ring-2 ring-purple-500/30'
              : 'border-purple-300 dark:border-purple-800 bg-purple-50/60 dark:bg-slate-800'
          } shadow-sm flex items-center justify-center transition-transform group-hover:scale-105`}>
            {node.avatar_url ? (
              <img 
                src={node.avatar_url.startsWith('http') ? node.avatar_url : `${import.meta.env.VITE_API_URL}${node.avatar_url}`} 
                alt={node.name} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className={`font-bold text-sm sm:text-base ${node.isCurrentUserRoot ? 'text-purple-600 dark:text-purple-400' : 'text-purple-700 dark:text-purple-300'} tracking-wider`}>
                {initials}
              </span>
            )}
          </div>

          {/* Small Top-Right Icon Badge */}
          <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full ${node.isCurrentUserRoot ? 'bg-gradient-to-tr from-violet-600 to-purple-600' : 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950'} text-white flex items-center justify-center text-[9px] shadow-xs`}>
            {node.isCurrentUserRoot ? <Sparkles className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
          </div>

          {/* Small Bottom Status Indicator Dot */}
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-xs" />
        </div>

        {/* Node Labels */}
        <div className="mt-2 flex flex-col items-center max-w-[160px] text-center">
          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate w-full" title={node.name}>
            {node.name}
          </span>
          <span className="text-[11px] font-semibold text-amber-500 dark:text-amber-400 font-mono mt-0.5">
            {username}
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 mt-0.5">
            {displayRank}
          </span>

          {/* Level / Generation Badge */}
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {node.isCurrentUserRoot 
                ? (tr("حسابي (Root)", "My Account")) 
                : `${tr("الجيل", "Gen")} ${level}`}
            </span>
            {(node.teamCount !== undefined && node.teamCount > 0) && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                {node.teamCount} {tr("فريق", "team")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stem & Children */}
      {hasChildren && (
        <div className="flex flex-col items-center">
          {/* Vertical stem down to toggle */}
          <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-700" />

          {/* Expand / Collapse Button directly on connector line */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 hover:text-primary hover:border-primary flex items-center justify-center text-xs font-black shadow-xs transition-all active:scale-90 z-10"
            title={isExpanded ? (tr("طي الأبناء", "Collapse")) : (tr("توسيع الأبناء", "Expand"))}
          >
            {isExpanded ? (
              <Minus className="h-3 w-3 stroke-[3]" />
            ) : (
              <Plus className="h-3 w-3 stroke-[3]" />
            )}
          </button>

          {/* When expanded, render branch and children */}
          {isExpanded && (
            <div className="flex flex-col items-center w-full">
              {/* Vertical stem down from toggle to horizontal bar */}
              <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-700" />

              {/* Children Row with Branch Lines */}
              <div className="flex justify-center items-start pt-0">
                {node.children.map((child, index) => {
                  const isFirst = index === 0;
                  const isLast = index === node.children.length - 1;
                  const isSingle = node.children.length === 1;

                  return (
                    <div key={child.id} className="relative flex flex-col items-center px-4 sm:px-6">
                      {/* Horizontal connecting line segments above each child */}
                      {!isSingle && (
                        <div className="absolute top-0 left-0 right-0 h-0.5">
                          {/* Left half line */}
                          <div 
                            className={`absolute top-0 left-0 w-1/2 h-0.5 ${
                              isFirst ? 'bg-transparent' : 'bg-slate-300 dark:bg-slate-700'
                            }`} 
                          />
                          {/* Right half line */}
                          <div 
                            className={`absolute top-0 right-0 w-1/2 h-0.5 ${
                              isLast ? 'bg-transparent' : 'bg-slate-300 dark:bg-slate-700'
                            }`} 
                          />
                        </div>
                      )}

                      {/* Vertical line dropping down to child node */}
                      <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-700" />

                      {/* Recursive call for Child Node */}
                      <VisualTreeNode
                        node={child}
                        level={level + 1}
                        expandedMap={expandedMap}
                        onToggleExpand={onToggleExpand}
                        onSelectNode={onSelectNode}
                        selectedNodeId={selectedNodeId}
                        highlightTerm={highlightTerm}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MAIN COMPONENT: STUDENT TEAM TREE PAGE
// -------------------------------------------------------------
export default function StudentTeamTree() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [rootNode, setRootNode] = useState<TreeNodeData | null>(null);
  const [allDownlineUsers, setAllDownlineUsers] = useState<TreeNodeData[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Inspector Focus
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [breadcrumbStack, setBreadcrumbStack] = useState<TreeNodeData[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Expand state
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  // Canvas Pan & Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Member details modal
  const [selectedMember, setSelectedMember] = useState<TreeNodeData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    loadTreeData();
  }, []);

  const loadTreeData = async () => {
    try {
      setLoading(true);
      const res = await affiliateService.getTeamTree();
      const rawTree = res.tree || [];
      const root = rawTree[0] || null;
      if (root) {
        root.isCurrentUserRoot = true;
      }
      setRootNode(root);
      setAllDownlineUsers(res.allUsers || []);
      setTotalCount(res.totalUsers || 0);
    } catch {
      toast.error(tr("فشل تحميل شجرة الفريق", "Failed to load team tree"));
    } finally {
      setLoading(false);
    }
  };

  // Active root node (either current user or focused member)
  const currentRootNode: TreeNodeData | null = useMemo(() => {
    if (!rootNode) return null;
    if (!focusedNodeId || focusedNodeId === rootNode.id) return rootNode;

    function findNode(node: TreeNodeData, targetId: string): TreeNodeData | null {
      if (node.id === targetId) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, targetId);
          if (found) return found;
        }
      }
      return null;
    }

    return findNode(rootNode, focusedNodeId) || rootNode;
  }, [rootNode, focusedNodeId]);

  // Generation counts for current tree
  const generationStats = useMemo(() => {
    const genCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    if (!currentRootNode) return genCounts;

    function traverse(node: TreeNodeData, currentLevel: number) {
      if (currentLevel > 0 && currentLevel <= 10) {
        genCounts[currentLevel] = (genCounts[currentLevel] || 0) + 1;
      }
      if (node.children) {
        node.children.forEach((child) => traverse(child, currentLevel + 1));
      }
    }

    if (currentRootNode.children) {
      currentRootNode.children.forEach((child) => traverse(child, 1));
    }

    return genCounts;
  }, [currentRootNode]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return allDownlineUsers.filter((u) => 
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.affiliate_code?.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [allDownlineUsers, searchTerm]);

  // Pan & Zoom controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleToggleExpand = (id: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: prev[id] === false ? true : false,
    }));
  };

  const handleExpandAll = () => {
    if (!rootNode) return;
    const newMap: Record<string, boolean> = {};
    function setAll(node: TreeNodeData) {
      newMap[node.id] = true;
      if (node.children) node.children.forEach(setAll);
    }
    setAll(rootNode);
    setExpandedMap(newMap);
    toast.success(tr("تم توسيع جميع الفروع", "All branches expanded"));
  };

  const handleCollapseAll = () => {
    if (!rootNode) return;
    const newMap: Record<string, boolean> = {};
    function setAll(node: TreeNodeData) {
      newMap[node.id] = false;
      if (node.children) node.children.forEach(setAll);
    }
    setAll(rootNode);
    if (currentRootNode) newMap[currentRootNode.id] = true;
    setExpandedMap(newMap);
    toast.info(tr("تم طي جميع الفروع", "All branches collapsed"));
  };

  const handleFocusMember = (member: TreeNodeData) => {
    setFocusedNodeId(member.id);
    setSelectedMember(null);
    setBreadcrumbStack((prev) => [...prev, member]);
    handleResetView();
  };

  const handleResetToMyTree = () => {
    setFocusedNodeId(null);
    setBreadcrumbStack([]);
    handleResetView();
  };

  const copyCode = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success(tr("تم نسخ كود الإحالة بنجاح", "Affiliate code copied"));
  };

  const affiliateCode = rootNode?.affiliate_code || user?.affiliate_code || 'NV------';
  const referralLink = `${window.location.origin}/auth?ref=${affiliateCode}`;

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 pb-16 font-sans max-w-7xl mx-auto">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Network className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{tr("شجرة الفريق والشبكة", "Team Tree")}</span>
                {totalCount > 1 && (
                  <Badge className="bg-purple-50 text-purple-600 dark:bg-purple-950/60 text-xs font-bold border-purple-200">
                    {totalCount - 1} {tr("عضو في الفريق", "Members")}
                  </Badge>
                )}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {tr("استعرض شبكة فريقك وتفاصيل الأجيال المباشرة وغير المباشرة بشكل تفاعلي مرئي.", "Interactive visual hierarchy of your downline team members across 10 generations.")}
              </p>
            </div>
          </div>

          {/* Quick invite link button */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(referralLink);
                toast.success(tr("تم نسخ رابط الإحالة!", "Referral link copied!"));
              }}
              className="rounded-xl h-10 text-xs font-bold gap-1.5 border-purple-200 dark:border-purple-800 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{tr("نسخ رابط الإحالة", "Copy Referral Link")}</span>
            </Button>
          </div>
        </div>

        {/* MAIN TREE CARD */}
        <Card className="rounded-[28px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_10px_35px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* 1. Header Toolbar with Search & Title */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder={tr("بحث بالاسم، البريد، أو الكود...", "Search by Name, Email, or Code...")}
                className="ps-10 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 h-10"
              />

              {/* Search dropdown results */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full start-0 end-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/60">
                  {searchResults.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => {
                        setSelectedMember(member);
                        setIsSearchOpen(false);
                      }}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {member.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">@{member.affiliate_code}</p>
                        </div>
                      </div>
                      <Badge className="text-[10px] bg-purple-50 text-purple-600 border-none shrink-0">
                        {member.package_name || 'Member'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Breadcrumb Navigation if Focused */}
            {focusedNodeId && (
              <div className="flex items-center gap-2 text-xs font-bold">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToMyTree}
                  className="h-8 rounded-xl text-primary hover:bg-primary/10 text-xs gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{tr("العودة لشجرتي الرئيسية", "Back to My Tree")}</span>
                </Button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
                <span className="text-slate-900 dark:text-white font-extrabold truncate max-w-xs">
                  {currentRootNode?.name}
                </span>
              </div>
            )}

            {/* Right Summary Counters */}
            <div className="flex items-center gap-3">
              <div className="text-end">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{tr("المباشرين (Gen 1)", "Direct Referrals")}</span>
                <span className="text-base font-black text-amber-500">{currentRootNode?.children?.length || 0}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-end">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{tr("إجمالي الفريق", "Team Downline")}</span>
                <span className="text-base font-black text-purple-600">{currentRootNode?.teamCount || 0}</span>
              </div>
            </div>
          </div>

          {/* 2. 10 Generations Breakdown Bar (matching Nexyvora Matching Bonus) */}
          <div className="px-4 sm:px-6 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              <span className="text-xs font-black text-slate-400 shrink-0 uppercase tracking-wider">
                {tr("الأجيال الـ 10:", "10 Generations:")}
              </span>
              {GENERATION_CONFIG.map((cfg) => {
                const count = generationStats[cfg.gen] || 0;
                return (
                  <div
                    key={cfg.gen}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0 text-xs shadow-2xs"
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      G{cfg.gen} ({cfg.rate}):
                    </span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Canvas Controls Toolbar (Zoom, Pan Reset, Expand/Collapse All) */}
          <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs bg-white dark:bg-slate-900">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
                className="h-8 w-8 p-0 rounded-xl"
                title={tr("تكبير", "Zoom In")}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
                className="h-8 w-8 p-0 rounded-xl"
                title={tr("تصغير", "Zoom Out")}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetView}
                className="h-8 px-2.5 rounded-xl text-xs gap-1"
                title={tr("إعادة ضبط العرض", "Reset View")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tr("إعادة ضبط", "Reset")}</span>
              </Button>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                className="h-8 px-2.5 rounded-xl text-xs gap-1 font-bold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{tr("توسيع الكل", "Expand All")}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollapseAll}
                className="h-8 px-2.5 rounded-xl text-xs gap-1 font-bold"
              >
                <Minus className="h-3.5 w-3.5" />
                <span>{tr("طي الكل", "Collapse All")}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-900"
                title={tr("ملء الشاشة", "Fullscreen")}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* 4. Interactive Canvas Body */}
          <div
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`relative w-full ${
              isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950 p-6' : 'min-h-[550px] max-h-[750px]'
            } overflow-auto cursor-grab active:cursor-grabbing select-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]`}
          >
            {isFullscreen && (
              <div className="absolute top-4 end-4 z-50">
                <Button
                  onClick={() => setIsFullscreen(false)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl bg-white dark:bg-slate-900 shadow-md"
                >
                  <Minimize2 className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                  {tr("خروج من ملء الشاشة", "Exit Fullscreen")}
                </Button>
              </div>
            )}

            {loading ? (
              <div className="h-[500px] flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <span className="text-xs font-bold">{tr("جاري بناء شجرة فريقك...", "Generating your team tree...")}</span>
              </div>
            ) : !currentRootNode ? (
              <div className="h-[500px] flex flex-col items-center justify-center gap-2 text-slate-400">
                <Users className="w-10 h-10 stroke-[1.5]" />
                <span className="text-sm font-bold">{tr("لا توجد بيانات متاحة", "No team data available")}</span>
              </div>
            ) : currentRootNode.children.length === 0 && currentRootNode.isCurrentUserRoot ? (
              /* ONBOARDING EMPTY TEAM STATE */
              <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                  <Network className="w-8 h-8 stroke-[2]" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {tr("ابدأ في بناء شجرة فريقك اليوم!", "Start building your team tree today!")}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {tr("لم تقم بدعوة أي أعضاء إلى فريقك بعد. شارك رابط إحالتك الفريد لتبدأ شجرتك في النمو وجني عمولات الـ 10 أجيال.", "You haven\\'t invited any members yet. Share your referral link to watch your tree expand.")}
                </p>

                <div className="mt-5 w-full space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-mono font-bold text-purple-600 truncate">{referralLink}</span>
                    <Button
                      size="sm"
                      onClick={() => copyCode(referralLink)}
                      className="rounded-xl h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* THE SCALED AND PANNED TREE */
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                }}
                className="w-full flex justify-center py-12 px-8 min-w-max"
              >
                <VisualTreeNode
                  node={currentRootNode}
                  level={0}
                  expandedMap={expandedMap}
                  onToggleExpand={handleToggleExpand}
                  onSelectNode={(node) => setSelectedMember(node)}
                  selectedNodeId={selectedMember?.id}
                  highlightTerm={searchTerm}
                />
              </div>
            )}
          </div>
        </Card>

        {/* 5. MEMBER DETAIL INSPECTOR MODAL */}
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-black text-slate-900 dark:text-white flex items-center justify-between">
                <span>{tr("تفاصيل عضو الفريق", "Team Member Details")}</span>
                {selectedMember?.kyc_status === 'verified' && (
                  <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 border-emerald-200 text-xs gap-1">
                    <ShieldCheck className="w-3 h-3" /> KYC Verified
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {tr("معلومات العضو وموقعه في شجرة فريقك", "Detailed performance & branch position")}
              </DialogDescription>
            </DialogHeader>

            {selectedMember && (
              <div className="space-y-4 py-2">
                {/* Profile row */}
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-purple-500/20 shrink-0">
                    {selectedMember.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {selectedMember.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">{selectedMember.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        @{selectedMember.affiliate_code}
                      </span>
                      <button
                        onClick={() => copyCode(selectedMember.affiliate_code)}
                        className="text-slate-400 hover:text-purple-600"
                        title={tr("نسخ الكود", "Copy code")}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Badges Grid (Package & Rank) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col justify-between">
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase block">
                      {tr("الباقة الحالية", "Current Package")}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Layers className="w-4 h-4 text-amber-500" />
                      <span className="font-black text-xs text-slate-900 dark:text-white">
                        {isRtl ? (selectedMember.package_name || 'لا توجد باقة') : (selectedMember.package_name_en || 'No Package')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex flex-col justify-between">
                    <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold uppercase block">
                      {tr("رتبة القيادة", "Leader Rank")}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span className="font-black text-xs text-slate-900 dark:text-white">
                        {isRtl ? (selectedMember.rank_name_ar || selectedMember.rank_name || 'عضو') : (selectedMember.rank_name || 'Member')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Team & Directs Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">{tr("الأعضاء المباشرين", "Direct Referrals")}</span>
                    <span className="text-lg font-black text-amber-500 block mt-0.5">{selectedMember.directCount || selectedMember.children?.length || 0}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">{tr("إجمالي شبكة الفريق", "Team Downline")}</span>
                    <span className="text-lg font-black text-purple-600 block mt-0.5">{selectedMember.teamCount || 0}</span>
                  </div>
                </div>

                {/* Joined Date */}
                {selectedMember.created_at && (
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {tr("تاريخ الانضمام:", "Joined Date:")}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(selectedMember.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {/* Focus Branch Button if they have children */}
                {!selectedMember.isCurrentUserRoot && (selectedMember.children?.length > 0 || (selectedMember.teamCount || 0) > 0) && (
                  <Button
                    onClick={() => handleFocusMember(selectedMember)}
                    className="w-full h-10 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-purple-500/20"
                  >
                    <Network className="w-4 h-4" />
                    <span>{tr("تصفح شجرة هذا العضو بالتفصيل", "Inspect This Member\\'s Tree")}</span>
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
