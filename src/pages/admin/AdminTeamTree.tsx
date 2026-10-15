import React, { useState, useEffect, useMemo, useRef } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { adminAffiliateService } from '@/services/apiService';
import { 
  Network, 
  Search, 
  Users, 
  UserCheck,
  ShieldCheck, 
  Award, 
  Trophy, 
  Wallet, 
  DollarSign, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Copy, 
  Check, 
  ExternalLink, 
  Layers, 
  Sparkles, 
  Plus, 
  Minus,
  ChevronDown,
  ChevronRight,
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Maximize2,
  Minimize2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// Color palette and commission rates for the 10 Generations Matching Bonus in Nexyvora
const GENERATION_CONFIG = [
  { gen: 1, rate: '5%', color: 'bg-blue-500' },
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
  balance?: number | string;
  total_earned?: number | string;
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
  isPlatformRoot?: boolean;
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
    if (node.isPlatformRoot) return 'NV';
    if (!node.name) return 'U';
    const parts = node.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return node.name.slice(0, 2).toUpperCase();
  }, [node]);

  // Display role / rank
  const displayRank = node.rank_name || (node.package_name ? `${node.package_name}` : 'DISTRIBUTOR');
  const username = node.isPlatformRoot ? '@nexyvora' : (node.affiliate_code ? `@${node.affiliate_code.toLowerCase()}` : `@${node.email.split('@')[0]}`);

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
        {/* Circular Avatar with blue ring & status indicators */}
        <div className="relative">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 ${
            node.isPlatformRoot 
              ? 'border-blue-500 bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950'
              : 'border-blue-400 bg-blue-50/60 dark:bg-slate-800'
          } shadow-sm flex items-center justify-center transition-transform group-hover:scale-105`}>
            {node.avatar_url ? (
              <img 
                src={node.avatar_url.startsWith('http') ? node.avatar_url : `${import.meta.env.VITE_API_URL}${node.avatar_url}`} 
                alt={node.name} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="font-bold text-sm sm:text-base text-blue-600 dark:text-blue-400 tracking-wider">
                {initials}
              </span>
            )}
          </div>

          {/* Small Top-Right Icon Badge */}
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] shadow-xs">
            {node.isPlatformRoot ? <Sparkles className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
          </div>

          {/* Small Bottom Status Indicator Dot */}
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-xs" />
        </div>

        {/* Node Labels */}
        <div className="mt-2 flex flex-col items-center max-w-[160px] text-center">
          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate w-full" title={node.name}>
            {node.name}
          </span>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
            {username}
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 mt-0.5">
            {displayRank}
          </span>
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
            className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-500 flex items-center justify-center text-xs font-black shadow-xs transition-all active:scale-90 z-10"
            title={isExpanded ? (tr("طي الأبناء", "Collapse Children")) : (tr("توسيع الأبناء", "Expand Children"))}
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

                      {/* Vertical line drop to child avatar */}
                      <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-700" />

                      {/* Recursive Child Node */}
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
// MAIN ADMIN TEAM TREE COMPONENT
// -------------------------------------------------------------
export default function AdminTeamTree() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [rawRoots, setRawRoots] = useState<TreeNodeData[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // Inspector & Root selection
  const [inspectedNodeId, setInspectedNodeId] = useState<string>('platform-root');
  const [inspectorSearch, setInspectorSearch] = useState('');
  const [isInspectorSearchOpen, setIsInspectorSearchOpen] = useState(false);

  // Search in Canvas
  const [searchTerm, setSearchTerm] = useState('');

  // Expand state: record of nodeId -> boolean
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  // Canvas pan & zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Member details modal
  const [selectedMember, setSelectedMember] = useState<TreeNodeData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    loadTreeData();
  }, []);

  const loadTreeData = async () => {
    try {
      setLoading(true);
      const res = await adminAffiliateService.getTeamTree();
      setRawRoots(res.tree || []);
      setAllUsers(res.allUsers || []);
      setTotalUsersCount(res.totalUsers || 0);
    } catch (err) {
      toast.error(tr("فشل تحميل شجرة الشبكة", "Failed to load network tree"));
    } finally {
      setLoading(false);
    }
  };

  // Virtual Platform Master Root for Nexyvora
  const masterPlatformRoot: TreeNodeData = useMemo(() => {
    let totalTeam = 0;
    rawRoots.forEach((r) => {
      totalTeam += 1 + (r.teamCount || 0);
    });

    return {
      id: 'platform-root',
      name: 'Nexyvora Platform',
      email: 'admin@nexyvora.com',
      affiliate_code: 'nexyvora',
      children: rawRoots,
      rank_name: 'PLATFORM ROOT',
      rank_color: '#8b5cf6',
      teamCount: totalTeam,
      directCount: rawRoots.length,
      isPlatformRoot: true,
    };
  }, [rawRoots]);

  // Find inspected root node
  const currentRootNode: TreeNodeData = useMemo(() => {
    if (inspectedNodeId === 'platform-root') {
      return masterPlatformRoot;
    }

    // Helper recursive search
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

    const found = findNode(masterPlatformRoot, inspectedNodeId);
    return found || masterPlatformRoot;
  }, [inspectedNodeId, masterPlatformRoot]);

  // Calculate 10 Generations breakdown for current root
  const generationStats = useMemo(() => {
    const genCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };

    function traverse(node: TreeNodeData, currentLevel: number) {
      if (currentLevel > 0 && currentLevel <= 10) {
        genCounts[currentLevel] = (genCounts[currentLevel] || 0) + 1;
      }
      if (node.children) {
        node.children.forEach((child) => traverse(child, currentLevel + 1));
      }
    }

    // Traverse children of root (root is Level 0, children are Level 1)
    if (currentRootNode.children) {
      currentRootNode.children.forEach((child) => traverse(child, 1));
    }

    return genCounts;
  }, [currentRootNode]);

  // Total Team & Active Members in current view
  const currentTeamTotal = useMemo(() => {
    return currentRootNode.teamCount !== undefined
      ? currentRootNode.teamCount
      : currentRootNode.children.length;
  }, [currentRootNode]);

  const activeMembersCount = useMemo(() => {
    // In MLM, active members are either with active package or total count
    return currentTeamTotal;
  }, [currentTeamTotal]);

  // Toggle expand for a node
  const handleToggleExpand = (id: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: prev[id] === false ? true : false,
    }));
  };

  // Expand all / Collapse all
  const handleExpandAll = () => {
    const newMap: Record<string, boolean> = {};
    function setAll(node: TreeNodeData) {
      newMap[node.id] = true;
      if (node.children) node.children.forEach(setAll);
    }
    setAll(masterPlatformRoot);
    setExpandedMap(newMap);
    toast.success(tr("تم توسيع جميع الفروع", "All branches expanded"));
  };

  const handleCollapseAll = () => {
    const newMap: Record<string, boolean> = {};
    function setAll(node: TreeNodeData) {
      newMap[node.id] = false;
      if (node.children) node.children.forEach(setAll);
    }
    setAll(masterPlatformRoot);
    // keep root expanded so its direct children are visible
    newMap[currentRootNode.id] = true;
    setExpandedMap(newMap);
    toast.info(tr("تم طي جميع الفروع", "All branches collapsed"));
  };

  // Canvas Mouse Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
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

  // Filtered members for Admin Tree Inspector search
  const inspectorSearchResults = useMemo(() => {
    if (!inspectorSearch.trim()) return [];
    const term = inspectorSearch.toLowerCase().trim();
    return allUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.affiliate_code?.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [allUsers, inspectorSearch]);

  const copyCode = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success(tr("تم نسخ الكود بنجاح", "Code copied successfully"));
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-16 font-sans">
        {/* Page Title & Subtitle */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Team Tree
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor the entire MLM network team hierarchy and performance.
          </p>
        </div>

        {/* Main Team Tree Container Card */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          {/* 1. Header Bar: Search by Name, Email, or ID + Team Tree Title on Right */}
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input on Left/Start */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Name, Email, or ID..."
                className="ltr:pl-10 rtl:pr-10 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* Title & Icon on Right/End */}
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold self-end sm:self-auto">
              <Network className="h-5 w-5 stroke-[2.2]" />
              <span className="text-sm sm:text-base font-black">Team Tree</span>
            </div>
          </div>

          {/* 2. Admin Tree Inspector Box */}
          <div className="p-4 sm:p-6 pt-5 pb-3">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>{tr("(Admin Tree Inspector) إدارة تصفح شجرة الأعضاء", "Admin Tree Inspector - Member Network Tree")}</span>
                </h3>

                {inspectedNodeId !== 'platform-root' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setInspectedNodeId('platform-root');
                      setInspectorSearch('');
                    }}
                    className="h-7 text-xs rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                  >
                    {tr("العودة لجذر المنصة (Nexyvora Root)", "Return to Platform Root (Nexyvora Root)")}
                  </Button>
                )}
              </div>

              {/* Search Member input */}
              <div className="relative">
                <Search className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={inspectorSearch}
                  onChange={(e) => {
                    setInspectorSearch(e.target.value);
                    setIsInspectorSearchOpen(true);
                  }}
                  onFocus={() => setIsInspectorSearchOpen(true)}
                  placeholder={tr("... ابحث عن اسم المستخدم، الاسم، أو البريد الإلكتروني للعضو", "Search by username, full name, or email...")}
                  className="ltr:pl-10 rtl:pr-10 rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />

                {/* Dropdown Results */}
                {isInspectorSearchOpen && inspectorSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {inspectorSearchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => {
                          setInspectedNodeId(user.id);
                          setIsInspectorSearchOpen(false);
                          setInspectorSearch('');
                          toast.success(tr("تم التبديل لتصفح شجرة: ${user.name}", "Switched to tree of: ${user.name}"));
                        }}
                        className="p-3 hover:bg-purple-50/60 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-purple-100 text-purple-700 text-[10px] font-bold">
                              {user.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-purple-600 font-semibold">{user.affiliate_code || '-'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Browsing Status */}
              <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span>{tr("تصفح شجرة العضو حالياً:", "Currently inspecting member tree:")}</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {currentRootNode.name}
                </span>
                <span className="font-mono text-blue-600">
                  ({currentRootNode.affiliate_code ? `@${currentRootNode.affiliate_code}` : '@nexyvora'})
                </span>
                <span>-</span>
                <span className="font-mono text-slate-400">
                  ID: #{currentRootNode.isPlatformRoot ? '0' : currentRootNode.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Generation Summary (10 Generations Matching Bonus) */}
          <div className="p-4 sm:p-6 pt-3 pb-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Generation Summary
              </h4>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                10 Generations (Matching Bonus)
              </span>
            </div>

            {/* 10 Generations Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3">
              {GENERATION_CONFIG.map(({ gen, rate, color }) => {
                const count = generationStats[gen] || 0;

                return (
                  <div
                    key={gen}
                    className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-purple-300 dark:hover:border-purple-800 transition-all"
                  >
                    {/* Circle with Generation Number & Rate Pill */}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full ${color} text-white font-bold text-xs flex items-center justify-center shadow-xs`}>
                        {gen}
                      </div>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800">
                        {rate}
                      </span>
                    </div>

                    {/* Members Count */}
                    <div className="mt-2 text-center">
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 block">
                        {count}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        members
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. KPI Summary Card: TOTAL TEAM + ACTIVE MEMBERS */}
          <div className="p-4 sm:p-6 pt-2 pb-4">
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
              {/* Left: Total Team */}
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    TOTAL TEAM
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono leading-tight">
                    {currentTeamTotal}
                  </span>
                </div>
              </div>

              {/* Right: Active Members */}
              <div className="text-right">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  ACTIVE MEMBERS
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-500 font-mono leading-tight">
                  {activeMembersCount}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Canvas Toolbar: Drag or pinch to navigate + Zoom Controls */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border-t border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Move className="h-3.5 w-3.5" />
              <span>Drag or pinch to navigate</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Expand All / Collapse All */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpandAll}
                className="h-7 text-[11px] rounded-lg px-2 text-slate-600 dark:text-slate-300"
              >
                {tr("توسيع الكل", "Expand All")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapseAll}
                className="h-7 text-[11px] rounded-lg px-2 text-slate-600 dark:text-slate-300"
              >
                {tr("طي الكل", "Collapse All")}
              </Button>

              <div className="h-4 w-px bg-slate-200 dark:border-slate-700 mx-1" />

              {/* Zoom Out */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
                className="h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300"
                title={tr("تصغير", "Zoom Out")}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>

              {/* Zoom Level Display */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetView}
                className="h-7 text-[11px] font-mono px-2.5 rounded-lg text-slate-700 dark:text-slate-200"
                title={tr("إعادة ضبط 100%", "Reset 100%")}
              >
                {Math.round(zoom * 100)}%
              </Button>

              {/* Zoom In */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
                className="h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300"
                title={tr("تكبير", "Zoom In")}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>

              {/* Reset Pan */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleResetView}
                className="h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300"
                title={tr("إعادة التمركز", "Center View")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* 6. Interactive Visual Tree Canvas */}
          <div
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`min-h-[600px] max-h-[820px] h-[65vh] w-full overflow-hidden relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="h-9 w-9 animate-spin text-purple-600 mb-3" />
                <p className="text-xs">{tr("جاري بناء وتوليد شجرة الشبكة الهرمية...", "Building and generating hierarchical team tree...")}</p>
              </div>
            ) : (
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
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

        {/* --- MEMBER DETAIL DIALOG (When clicking any node in the tree) --- */}
        <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
          <DialogContent className="max-w-md p-0 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
            {selectedMember && (
              <>
                {/* Header with Avatar & Name */}
                <div className="p-6 bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white relative">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-full border-2 border-white/60 bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xl text-white shadow-md">
                      {selectedMember.avatar_url ? (
                        <img 
                          src={selectedMember.avatar_url.startsWith('http') ? selectedMember.avatar_url : `${import.meta.env.VITE_API_URL}${selectedMember.avatar_url}`} 
                          alt={selectedMember.name} 
                          className="w-full h-full rounded-full object-cover" 
                        />
                      ) : (
                        selectedMember.isPlatformRoot ? 'NV' : selectedMember.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black truncate">{selectedMember.name}</h3>
                        {selectedMember.isPlatformRoot && (
                          <Badge className="bg-amber-400 text-slate-900 text-[9px] font-black">NEXYVORA</Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/80 font-mono mt-0.5 truncate">{selectedMember.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase">
                          {selectedMember.rank_name || 'DISTRIBUTOR'}
                        </span>
                        {selectedMember.package_name && (
                          <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
                            {selectedMember.package_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-4 text-xs">
                  {/* Referral Code & Copy */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tr("كود الإحالة (Affiliate Code)", "Affiliate Code")}</span>
                      <span className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400">
                        {selectedMember.affiliate_code || '-'}
                      </span>
                    </div>
                    {selectedMember.affiliate_code && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCode(selectedMember.affiliate_code)}
                        className="h-8 rounded-xl gap-1 text-slate-500"
                      >
                        {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCode ? (tr("تم النسخ", "Copied")) : (tr("نسخ", "Copy"))}</span>
                      </Button>
                    )}
                  </div>

                  {/* 2 Stats Cards: Team Size & Direct Referrals */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{tr("المباشرين (Directs)", "Direct Referrals")}</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {selectedMember.children?.length || 0}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{tr("إجمالي الفريق (Team)", "Total Team")}</span>
                      <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono">
                        {selectedMember.teamCount || 0}
                      </span>
                    </div>
                  </div>

                  {/* Financials: Balance & Total Earned */}
                  {!selectedMember.isPlatformRoot && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase block">{tr("الرصيد المالي", "Wallet Balance")}</span>
                        <span className="text-base font-black text-emerald-600 font-mono">
                          ${Number(selectedMember.balance || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                        <span className="text-[10px] text-purple-600 font-bold uppercase block">{tr("إجمالي العمولات", "Total Commissions")}</span>
                        <span className="text-base font-black text-purple-600 font-mono">
                          ${Number(selectedMember.total_earned || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Joined Date */}
                  {selectedMember.created_at && (
                    <div className="flex items-center justify-between text-slate-400 text-[11px] px-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{tr("تاريخ الانضمام:", "Joined Date:")}</span>
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        {new Date(selectedMember.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Action: Set as Root Node in Inspector */}
                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setInspectedNodeId(selectedMember.id);
                        setSelectedMember(null);
                        toast.success(tr("تم تعيين ${selectedMember.name} كجذر تصفح للشجرة", "Set ${selectedMember.name} as tree root"));
                      }}
                      className="flex-1 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs h-10 shadow-md shadow-purple-500/20"
                    >
                      {tr("تصفح شجرة هذا العضو كجذر", "Inspect this member tree as root")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMember(null)}
                      className="rounded-2xl text-xs h-10 px-4"
                    >
                      {tr("إغلاق", "Close")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
