/**
 * @file Module4AIAdvisorHub.tsx
 * @description 模块四：三级级联理想方向探索、全库关键词查方向与 62 所生物导师名录中心
 * 1. 全量三级匹配规则、3,089 位导师方向语料与名录均仅驻留服务端，前端通过 /api/explore/* 与 /api/advisors/* 按需请求。
 * 2. 工作区 1（三级级联同屏看板）：生物学领域 -> 研究方向 -> 细分小方向，按相关度排序精选 10-20 个官方方向。
 * 3. 工作区 2（兴趣关键词查方向）：需先完成三级探索后解锁。
 * 4. 工作区 3（62 所生物导师名录）：纯客观分页名录查询。
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  Globe,
  Layers,
  Lock,
  Mail,
  Search,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import {
  AIAdvisorDeepProfile,
  AIAdvisorMatchResponse,
  AIDirectionReport,
  CasAdvisor,
  PublicBiologyDomainNode,
} from '../types/cas';

interface Module4AIAdvisorHubProps {
  directionQuizCompleted: boolean;
  lockedTeamName: string;
  lockedAdvisorId: string;
  onCompleteDirectionQuiz: (summary: string) => void;
  onLockTeamTarget: (payload: {
    instituteId?: string;
    instituteName: string;
    majorCode: string;
    directionName: string;
  }) => void;
  onLockAdvisor: (advisor: CasAdvisor) => void;
  onSaveAiSummaryForWhitepaper: (summary: string) => void;
}

interface ExploreTreeResponse {
  tree: PublicBiologyDomainNode[];
  corpusStats: {
    totalAdvisorsAnalyzed: number;
    uniqueTopicsCount: number;
  };
}

interface AdvisorsMetaResponse {
  totalAdvisors: number;
  instituteCounts: { id: string; name: string; count: number }[];
}

interface AdvisorsPageResponse {
  items: CasAdvisor[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

const DIRECTORY_PAGE_SIZE = 18;

export const Module4AIAdvisorHub: React.FC<Module4AIAdvisorHubProps> = ({
  directionQuizCompleted,
  lockedTeamName,
  lockedAdvisorId,
  onCompleteDirectionQuiz,
  onLockTeamTarget,
  onLockAdvisor,
  onSaveAiSummaryForWhitepaper,
}) => {
  const [workspace, setWorkspace] = useState<'quiz' | 'keyword' | 'directory'>('quiz');

  // === 工作区 1：三级级联同屏看板（L1 领域 -> L2 研究方向 -> L3 细分小方向） ===
  const [tree, setTree] = useState<PublicBiologyDomainNode[]>([]);
  const [corpusStats, setCorpusStats] = useState({
    totalAdvisorsAnalyzed: 3089,
    uniqueTopicsCount: 0,
  });
  const [level1Id, setLevel1Id] = useState<string>('');
  const [level2Id, setLevel2Id] = useState<string>('');
  const [level3Id, setLevel3Id] = useState<string>('');
  const [matchingAdvisorCount, setMatchingAdvisorCount] = useState<number>(0);

  const [extraNotes, setExtraNotes] = useState('');
  const [resultFilterQuery, setResultFilterQuery] = useState('');
  const [quizReport, setQuizReport] = useState<AIDirectionReport | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // 加载服务端三级树（已剥离匹配规则与关键词语料）
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/explore/tree', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('tree fetch error'))))
      .then((data: ExploreTreeResponse) => {
        setTree(data.tree);
        if (data.corpusStats) setCorpusStats(data.corpusStats);
        if (data.tree.length > 0) {
          const d1 = data.tree[0];
          const d2 = d1.directions[0];
          const d3 = d2?.subSpecialties[0];
          setLevel1Id((prev) => prev || d1.id);
          setLevel2Id((prev) => prev || d2?.id || '');
          setLevel3Id((prev) => prev || d3?.id || '');
        }
      })
      .catch(() => {
        // 忽略中断错误
      });
    return () => controller.abort();
  }, []);

  const activeLevel1 = useMemo(
    () => tree.find((d) => d.id === level1Id) ?? tree[0] ?? null,
    [tree, level1Id]
  );
  const activeLevel2 = useMemo(
    () =>
      activeLevel1?.directions.find((d) => d.id === level2Id) ??
      activeLevel1?.directions[0] ??
      null,
    [activeLevel1, level2Id]
  );
  const activeLevel3 = useMemo(
    () =>
      activeLevel2?.subSpecialties.find((s) => s.id === level3Id) ??
      activeLevel2?.subSpecialties[0] ??
      null,
    [activeLevel2, level3Id]
  );

  // 查询当前选中细分方向匹配的导师方向语料数量
  useEffect(() => {
    if (!activeLevel3?.id) return;
    const controller = new AbortController();
    fetch(`/api/explore/corpus-count?subId=${encodeURIComponent(activeLevel3.id)}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { matchingAdvisorCount: number } | null) => {
        if (data) setMatchingAdvisorCount(data.matchingAdvisorCount);
      })
      .catch(() => {
        // 忽略中断错误
      });
    return () => controller.abort();
  }, [activeLevel3?.id]);

  const handleSelectLevel1 = (id: string) => {
    const dom = tree.find((d) => d.id === id);
    if (!dom) return;
    const d2 = dom.directions[0];
    const d3 = d2?.subSpecialties[0];
    setLevel1Id(dom.id);
    setLevel2Id(d2?.id ?? '');
    setLevel3Id(d3?.id ?? '');
    setQuizReport(null);
  };

  const handleSelectLevel2 = (id: string) => {
    if (!activeLevel1) return;
    const d2 = activeLevel1.directions.find((d) => d.id === id);
    if (!d2) return;
    const d3 = d2.subSpecialties[0];
    setLevel2Id(d2.id);
    setLevel3Id(d3?.id ?? '');
    setQuizReport(null);
  };

  const handleSelectLevel3 = (id: string) => {
    if (!activeLevel2) return;
    const d3 = activeLevel2.subSpecialties.find((s) => s.id === id);
    if (!d3) return;
    setLevel3Id(d3.id);
    setQuizReport(null);
  };

  const handleRunDirectionQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLevel1 || !activeLevel2 || !activeLevel3) return;
    setResultFilterQuery('');
    setQuizSubmitting(true);
    try {
      const resp = await fetch('/api/explore/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level1DomainId: activeLevel1.id,
          level2DirectionId: activeLevel2.id,
          level3SubSpecialtyId: activeLevel3.id,
          extraNotes,
        }),
      });
      if (!resp.ok) throw new Error('recommend error');
      const report = (await resp.json()) as AIDirectionReport;
      setQuizReport(report);
      onCompleteDirectionQuiz(`三级方向探索（${activeLevel3.name}）：${report.headline}`);
    } finally {
      setQuizSubmitting(false);
    }
  };

  const filteredRecommendedDirections = useMemo(() => {
    const list = quizReport?.recommendedTeams ?? [];
    const q = resultFilterQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) =>
      [
        item.instituteName,
        item.majorCode,
        item.majorName,
        item.directionName,
        item.suggestedSubjects,
        ...(item.advisorDirectionTopics ?? []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [quizReport, resultFilterQuery]);

  // === 工作区 2：兴趣关键词查全库招生方向（需先完成三级探索后解锁） ===
  const [teamKeyword, setTeamKeyword] = useState('');
  const [teamMatchError, setTeamMatchError] = useState<string | null>(null);
  const [teamMatchResult, setTeamMatchResult] = useState<AIAdvisorMatchResponse | null>(null);
  const [teamMatchLoading, setTeamMatchLoading] = useState(false);

  const handleRunTeamMatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!directionQuizCompleted) return;
    const query = teamKeyword.trim();
    if (!query) {
      setTeamMatchError('请输入研究兴趣关键词、专业代码或学科词后再检索。');
      return;
    }
    setTeamMatchError(null);
    setTeamMatchLoading(true);
    try {
      const resp = await fetch('/api/explore/match-keyword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: query,
          quizCompleted: directionQuizCompleted,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setTeamMatchError(data?.error || '检索请求失败，请重试。');
        return;
      }
      setTeamMatchResult(data as AIAdvisorMatchResponse);
    } catch {
      setTeamMatchError('网络连接异常，请稍后重试。');
    } finally {
      setTeamMatchLoading(false);
    }
  };

  // === 工作区 3：62 所生物导师名录（服务端分页检索，纯客观名录查询） ===
  const [totalAdvisors, setTotalAdvisors] = useState<number>(3089);
  const [instituteCounts, setInstituteCounts] = useState<{ id: string; name: string; count: number }[]>([]);
  const [dirInstituteId, setDirInstituteId] = useState<string>('ioz');
  const [dirSearchQuery, setDirSearchQuery] = useState<string>('');
  const [dirDegreeLevel, setDirDegreeLevel] = useState<'ALL' | '硕士' | '博士'>('ALL');
  const [dirPage, setDirPage] = useState<number>(1);
  const [paginatedDirectory, setPaginatedDirectory] = useState<AdvisorsPageResponse>({
    items: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [selectedAdvisorObj, setSelectedAdvisorObj] = useState<CasAdvisor | null>(null);
  const [deepProfile, setDeepProfile] = useState<AIAdvisorDeepProfile | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/advisors/meta', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AdvisorsMetaResponse | null) => {
        if (!data) return;
        setTotalAdvisors(data.totalAdvisors);
        setInstituteCounts(data.instituteCounts || []);
      })
      .catch(() => {
        // 忽略中断错误
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setDirPage(1);
  }, [dirInstituteId, dirSearchQuery, dirDegreeLevel]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      params.set('instituteId', dirInstituteId);
      if (dirSearchQuery.trim()) params.set('search', dirSearchQuery.trim());
      params.set('degreeLevel', dirDegreeLevel);
      params.set('page', String(dirPage));
      params.set('pageSize', String(DIRECTORY_PAGE_SIZE));

      fetch(`/api/advisors?${params.toString()}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('advisors fetch error'))))
        .then((data: AdvisorsPageResponse) => {
          setPaginatedDirectory(data);
          setSelectedAdvisorObj((prev) =>
            prev && data.items.some((a) => a.id === prev.id)
              ? prev
              : data.items[0] ?? null
          );
        })
        .catch(() => {
          // 忽略中断错误
        });
    }, dirSearchQuery ? 120 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [dirInstituteId, dirSearchQuery, dirDegreeLevel, dirPage]);

  const handleSelectDirectoryAdvisor = (adv: CasAdvisor) => {
    setSelectedAdvisorObj(adv);
    if (deepProfile?.advisorName !== adv.name) {
      setDeepProfile(null);
    }
  };

  const handleAnalyzeSelectedProfile = async (adv: CasAdvisor) => {
    try {
      const resp = await fetch('/api/advisors/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advisorId: adv.id }),
      });
      if (!resp.ok) return;
      const profile = (await resp.json()) as AIAdvisorDeepProfile;
      setDeepProfile(profile);
      onSaveAiSummaryForWhitepaper(
        `${adv.name} 公开方向摘要：${profile.plainLanguageResearch.slice(0, 110)}...`
      );
    } catch {
      // 忽略异常
    }
  };

  return (
    <section aria-label="模块四：三级方向探索与62所生物导师名录" className="space-y-6">
      {/* 头部 + 工作区切换 */}
      <div className="space-y-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            三级方向探索与 62 所导师名录
          </h2>
        </div>

        {/* 工作区 Tab 切换 */}
        <div
          role="tablist"
          aria-label="模块四工作区"
          className="inline-grid w-full grid-cols-1 border border-slate-300 bg-white sm:w-auto sm:grid-cols-3"
        >
          <button
            type="button"
            role="tab"
            aria-selected={workspace === 'quiz'}
            onClick={() => setWorkspace('quiz')}
            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              workspace === 'quiz'
                ? 'bg-[#00407A] text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            1. 三级方向探索
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={workspace === 'keyword'}
            onClick={() => setWorkspace('keyword')}
            className={`border-t sm:border-t-0 sm:border-l border-slate-300 px-4 py-2.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              workspace === 'keyword'
                ? 'bg-[#006B77] text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            2. 关键词查方向{directionQuizCompleted ? '' : '（待探索解锁）'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={workspace === 'directory'}
            onClick={() => setWorkspace('directory')}
            className={`border-t sm:border-t-0 sm:border-l border-slate-300 px-4 py-2.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              workspace === 'directory'
                ? 'bg-[#AD1E24] text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            3. 62所导师名录（{totalAdvisors}位）
          </button>
        </div>
      </div>

      {/* =================================================================
          工作区 1：三级级联同屏看板
         ================================================================= */}
      {workspace === 'quiz' && (
        <div className="space-y-5">
          {!activeLevel1 || !activeLevel2 || !activeLevel3 ? (
            <div className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              正在加载生物学三级研究方向图谱...
            </div>
          ) : (
            <>
              <div className="border border-slate-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-[#00407A]">当前三级路径：</span>
                  <span className="font-semibold text-slate-900">{activeLevel1.name}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-slate-900">{activeLevel2.name}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-[#006B77]">{activeLevel3.name}</span>
                </div>
                <span className="font-mono text-[11px] text-[#006B77] tabular-nums">
                  已并入 {corpusStats.totalAdvisorsAnalyzed.toLocaleString()} 导师方向库：
                  {matchingAdvisorCount} 项相近方向语料
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Level 1 */}
                <div className="border border-slate-200 bg-white flex flex-col">
                  <div className="border-b border-slate-200 bg-slate-50 px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#00407A]">1级 · 生物学研究领域</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {tree.length} 类
                    </span>
                  </div>
                  <div className="p-2 space-y-1.5 max-h-[380px] overflow-y-auto">
                    {tree.map((dom) => {
                      const active = dom.id === activeLevel1.id;
                      return (
                        <button
                          key={dom.id}
                          type="button"
                          onClick={() => handleSelectLevel1(dom.id)}
                          className={`w-full px-3 py-2 text-left transition-colors border ${
                            active
                              ? 'border-[#00407A] bg-[#00407A] text-white'
                              : 'border-transparent bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-white'
                          }`}
                        >
                          <div className="text-xs font-bold">{dom.name}</div>
                          <div
                            className={`mt-0.5 text-[11px] truncate ${
                              active ? 'text-sky-100' : 'text-slate-500'
                            }`}
                          >
                            {dom.subtitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Level 2 */}
                <div className="border border-slate-200 bg-white flex flex-col">
                  <div className="border-b border-slate-200 bg-slate-50 px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#00407A]">2级 · 研究方向</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {activeLevel1.directions.length} 个
                    </span>
                  </div>
                  <div className="p-2 space-y-1.5 max-h-[380px] overflow-y-auto">
                    {activeLevel1.directions.map((dir) => {
                      const active = dir.id === activeLevel2.id;
                      return (
                        <button
                          key={dir.id}
                          type="button"
                          onClick={() => handleSelectLevel2(dir.id)}
                          className={`w-full p-2.5 text-left transition-colors border ${
                            active
                              ? 'border-[#00407A] bg-[#F0F5FA] text-[#00407A]'
                              : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs font-bold">{dir.name}</div>
                          <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-1">{dir.summary}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Level 3 */}
                <div className="border border-slate-200 bg-white flex flex-col">
                  <div className="border-b border-slate-200 bg-slate-50 px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#006B77]">3级 · 细分小方向</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {activeLevel2.subSpecialties.length} 个
                    </span>
                  </div>
                  <div className="p-2 space-y-1.5 max-h-[380px] overflow-y-auto">
                    {activeLevel2.subSpecialties.map((sub) => {
                      const active = sub.id === activeLevel3.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleSelectLevel3(sub.id)}
                          className={`w-full p-2.5 text-left transition-colors border ${
                            active
                              ? 'border-[#006B77] bg-[#F0F9FA] text-[#006B77]'
                              : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs font-bold">{sub.name}</div>
                          <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-1">{sub.summary}</p>
                          {sub.keyMethods.length > 0 && (
                            <div className="mt-1 text-[11px] text-slate-500 truncate">
                              技术：{sub.keyMethods.join(' · ')}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleRunDirectionQuiz}
                className="border border-slate-200 bg-white p-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
              >
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="q-notes" className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Layers className="h-3.5 w-3.5 text-[#00407A]" />
                    <span>补充关键词或意向城市（选填，将加权全库 62 所方向相关度排序）</span>
                  </label>
                  <input
                    id="q-notes"
                    type="text"
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    placeholder="例如：Python / 上海 / 生物医学工程 / 水产 / 抗逆"
                    className="w-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#00407A] focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={quizSubmitting}
                  className="metro-tile shrink-0 inline-flex items-center justify-center gap-2 bg-[#00407A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002B54] disabled:opacity-60 whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{quizSubmitting ? '正在匹配方向...' : '完成三级探索 · 精选高相关方向'}</span>
                </button>
              </form>

              {quizReport && (
                <div className="space-y-4">
                  <div className="bg-[#00407A] p-4 text-white flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="text-xs font-mono text-sky-200">
                        按相关度从高到低排序 · 精选 TOP {quizReport.recommendedTeams.length} 个方向
                      </div>
                      <h3 className="text-base font-bold">{quizReport.headline}</h3>
                      <p className="text-xs text-sky-100">{quizReport.profileSummary}</p>
                    </div>
                    <div className="shrink-0 w-full md:w-64">
                      <label htmlFor="quiz-result-filter" className="sr-only">
                        筛选当前精选结果
                      </label>
                      <input
                        id="quiz-result-filter"
                        type="text"
                        value={resultFilterQuery}
                        onChange={(e) => setResultFilterQuery(e.target.value)}
                        placeholder="按院所、代码或科目过滤精选结果..."
                        className="w-full border border-sky-300/40 bg-[#002B54] px-3 py-1.5 text-xs text-white placeholder:text-sky-200/70 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRecommendedDirections.map((team, idx) => {
                      const fullTag = `${team.instituteName.replace('中国科学院', '')} · ${team.majorCode} ${team.directionName}`;
                      const isLocked = lockedTeamName === fullTag;
                      return (
                        <div
                          key={`${team.instituteName}-${team.majorCode}-${team.directionName}-${idx}`}
                          className="border border-slate-200 bg-white p-4 flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                              <span className="font-bold text-[#006B77]">
                                #{String(idx + 1).padStart(2, '0')} · {team.degreeType || '统考方向'}
                              </span>
                              <span className="text-slate-500 truncate">{team.suggestedSubjects}</span>
                            </div>
                            <div className="text-xs font-bold text-[#00407A] truncate">
                              {team.instituteName}
                            </div>
                            <div className="text-xs font-semibold text-slate-900">
                              {team.majorCode} {team.majorName}
                            </div>
                            <div className="text-xs font-bold text-[#AD1E24] border-t border-slate-100 pt-1.5">
                              方向：{team.directionName}
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-1">{team.matchReason}</p>
                            {team.advisorFocusNote && (
                              <p className="text-[11px] text-slate-500 truncate">{team.advisorFocusNote}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                onLockTeamTarget({
                                  instituteId: team.instituteId,
                                  instituteName: team.instituteName,
                                  majorCode: team.majorCode,
                                  directionName: team.directionName,
                                })
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold ${
                                isLocked
                                  ? 'bg-[#006B77] text-white'
                                  : 'bg-[#00407A] text-white hover:bg-[#002B54]'
                              }`}
                            >
                              {isLocked ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Target className="h-3.5 w-3.5" />
                              )}
                              <span>{isLocked ? '已锁定' : '锁定至白皮书'}</span>
                            </button>
                            {team.instituteId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDirInstituteId(team.instituteId!);
                                  setWorkspace('directory');
                                }}
                                className="text-[11px] font-medium text-[#00407A] hover:underline"
                              >
                                查该所名录 →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* =================================================================
          工作区 2：兴趣关键词查全库招生方向（需先解锁）
         ================================================================= */}
      {workspace === 'keyword' && (
        <div className="space-y-5">
          {!directionQuizCompleted ? (
            <div className="border border-slate-300 bg-white p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center bg-slate-100 text-[#00407A]">
                <Lock className="h-6 w-6" />
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="text-base font-bold text-slate-900">
                  完成「三级方向探索」后解锁关键词全库检索
                </h3>
                <p className="text-xs text-slate-600">
                  在完成工作区一的三级探索流程前，系统不主动做方向匹配；客观查阅导师请切换至工作区三。
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setWorkspace('quiz')}
                  className="metro-tile inline-flex items-center gap-1.5 bg-[#00407A] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#002B54]"
                >
                  <Compass className="h-4 w-4" />
                  <span>前往完成三级方向探索</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspace('directory')}
                  className="border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  查阅 62 所导师名录
                </button>
              </div>
            </div>
          ) : (
            <>
              <form
                onSubmit={handleRunTeamMatch}
                className="border border-slate-200 bg-white p-4 flex flex-col gap-3 md:flex-row"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    aria-label="输入研究关键词检索全库62所招生方向"
                    value={teamKeyword}
                    onChange={(e) => setTeamKeyword(e.target.value)}
                    placeholder="输入研究关键词、专业代码或学科词检索全库 62 所招生方向..."
                    className="w-full border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-[#006B77] focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={teamMatchLoading}
                  className="metro-tile inline-flex items-center justify-center gap-2 bg-[#006B77] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#005862] disabled:opacity-60 whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{teamMatchLoading ? '正在检索...' : '检索全库招生方向'}</span>
                </button>
              </form>

              {teamMatchError && (
                <div
                  role="alert"
                  className="border border-[#AD1E24] bg-red-50 p-4 text-xs text-[#AD1E24]"
                >
                  {teamMatchError}
                </div>
              )}

              {teamMatchResult && (
                <div className="border border-[#006B77] bg-white p-4 space-y-4">
                  <p className="text-sm font-medium text-slate-800 border-b border-slate-100 pb-2">
                    {teamMatchResult.queryInterpretation}
                  </p>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {teamMatchResult.matches?.map((m, i) => {
                      const fullTag = `${m.instituteName.replace('中国科学院', '')} · ${m.majorCode} ${m.directionName}`;
                      const isLocked = lockedTeamName === fullTag;
                      return (
                        <div
                          key={`${m.instituteName}-${m.majorCode}-${m.directionName}-${i}`}
                          className="border border-slate-200 bg-[#F8FAFC] p-4 flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] gap-2">
                              <span className="font-semibold text-[#006B77] shrink-0">
                                {m.fitLevel}
                              </span>
                              <span className="font-mono text-slate-500 truncate">
                                {m.examSubjects}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-[#00407A] truncate">
                              {m.instituteName}
                            </div>
                            <div className="text-xs font-semibold text-slate-900">
                              {m.majorCode} {m.majorName}
                            </div>
                            <div className="text-xs font-bold text-[#AD1E24] border-t border-slate-200 pt-1.5">
                              方向：{m.directionName}
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2">
                              {m.matchReason}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                onLockTeamTarget({
                                  instituteId: m.instituteId,
                                  instituteName: m.instituteName,
                                  majorCode: m.majorCode,
                                  directionName: m.directionName,
                                })
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold ${
                                isLocked
                                  ? 'bg-[#006B77] text-white'
                                  : 'bg-[#00407A] text-white hover:bg-[#002B54]'
                              }`}
                            >
                              {isLocked ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Target className="h-3.5 w-3.5" />
                              )}
                              <span>{isLocked ? '已锁定' : '锁定至白皮书'}</span>
                            </button>

                            {m.instituteId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDirInstituteId(m.instituteId!);
                                  setWorkspace('directory');
                                }}
                                className="inline-flex items-center gap-1 border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-[#00407A]"
                              >
                                <span>查该所名录</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* =================================================================
          工作区 3：62 所全量生物导师名录（服务端分页）
         ================================================================= */}
      {workspace === 'directory' && (
        <div className="space-y-4">
          <div className="border border-slate-200 bg-white p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="min-w-[260px] flex-1 max-w-sm">
                <label htmlFor="dir-inst-select" className="sr-only">
                  按研究所筛选生物导师名录
                </label>
                <select
                  id="dir-inst-select"
                  value={dirInstituteId}
                  onChange={(e) => setDirInstituteId(e.target.value)}
                  className="w-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#00407A] focus:outline-none"
                >
                  <option value="ALL">全部 62 所培养单位名录（{totalAdvisors} 位）</option>
                  {instituteCounts.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}（{inst.count} 位）
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  aria-label="在所选研究所内检索姓名、专业或研究方向"
                  value={dirSearchQuery}
                  onChange={(e) => setDirSearchQuery(e.target.value)}
                  placeholder="检索姓名、专业或研究词..."
                  className="w-full border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-[#00407A] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 border border-slate-300 text-xs">
              {(['ALL', '硕士', '博士'] as const).map((lvl, idx) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDirDegreeLevel(lvl)}
                  className={`px-3 py-2 font-semibold whitespace-nowrap ${
                    dirDegreeLevel === lvl
                      ? 'bg-[#00407A] text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  } ${idx > 0 ? 'border-l border-slate-300' : ''}`}
                >
                  {lvl === 'ALL' ? '全部层级' : `${lvl}导师`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* 左侧：分页名录 */}
            <aside className="lg:col-span-5 border border-slate-200 bg-white flex flex-col">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Users className="h-4 w-4 text-[#00407A]" />
                  <span>导师列表</span>
                </div>
                <span className="font-mono text-slate-600 tabular-nums">
                  {paginatedDirectory.totalCount} 位 · {paginatedDirectory.currentPage}/
                  {paginatedDirectory.totalPages} 页
                </span>
              </div>

              {paginatedDirectory.items.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  暂无匹配导师记录，请切换研究所或关键词。
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {paginatedDirectory.items.map((adv) => {
                    const isSelected = selectedAdvisorObj?.id === adv.id;
                    return (
                      <button
                        key={adv.id}
                        type="button"
                        onClick={() => handleSelectDirectoryAdvisor(adv)}
                        className={`w-full px-4 py-3 text-left transition-colors ${
                          isSelected ? 'bg-[#F0F5FA]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-900">{adv.name}</span>
                          <span className="text-[11px] font-mono text-[#006B77]">
                            {(adv.degreeLevels || ['硕士']).join('/')}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500 truncate">
                          {adv.instituteName.replace('中国科学院', '')} · {adv.department}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-600 truncate">
                          {adv.keywords.join(' · ')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-auto border-t border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center justify-between text-xs">
                <button
                  type="button"
                  disabled={paginatedDirectory.currentPage <= 1}
                  onClick={() => setDirPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>上一页</span>
                </button>
                <span className="font-mono text-slate-600 tabular-nums">
                  {paginatedDirectory.currentPage} / {paginatedDirectory.totalPages}
                </span>
                <button
                  type="button"
                  disabled={paginatedDirectory.currentPage >= paginatedDirectory.totalPages}
                  onClick={() =>
                    setDirPage((p) => Math.min(paginatedDirectory.totalPages, p + 1))
                  }
                  className="inline-flex items-center gap-1 border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  <span>下一页</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </aside>

            {/* 右侧：导师客观官方名录详情卡片 */}
            <div className="lg:col-span-7 space-y-4">
              {selectedAdvisorObj ? (
                <div className="border border-slate-200 bg-white p-6 space-y-5">
                  <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs font-mono text-[#006B77]">{selectedAdvisorObj.title}</div>
                      <h3 className="mt-1 text-2xl font-bold text-slate-900">
                        {selectedAdvisorObj.name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-[#00407A]">
                        {selectedAdvisorObj.instituteName} · {selectedAdvisorObj.department}
                      </p>
                    </div>

                    {(() => {
                      const isFallbackUrl =
                        /^https?:\/\/[^/]+\/?$/.test(selectedAdvisorObj.labUrl || '') ||
                        (selectedAdvisorObj.labUrl || '').includes('admission.ucas.ac.cn');
                      return (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <a
                            href={selectedAdvisorObj.labUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="metro-tile inline-flex items-center gap-1.5 bg-[#00407A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#002B54]"
                          >
                            <Globe className="h-3.5 w-3.5" />
                            <span>{isFallbackUrl ? '访问所属院所目录' : '访问导师本人主页'}</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => onLockAdvisor(selectedAdvisorObj)}
                            className={`px-3 py-2 text-xs font-semibold ${
                              lockedAdvisorId === selectedAdvisorObj.id
                                ? 'bg-[#006B77] text-white'
                                : 'border border-slate-300 text-slate-700 hover:border-[#00407A]'
                            }`}
                          >
                            {lockedAdvisorId === selectedAdvisorObj.id ? '已记入白皮书' : '记入白皮书备忘'}
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {(() => {
                    const isFallbackUrl =
                      /^https?:\/\/[^/]+\/?$/.test(selectedAdvisorObj.labUrl || '') ||
                      (selectedAdvisorObj.labUrl || '').includes('admission.ucas.ac.cn');
                    const isOfficeEmail =
                      /^(yjs|yzb|zs|zhaosheng|grad|edu|admissions|yjsb|yjsy|xsc|yanzhao)@/i.test(
                        selectedAdvisorObj.email || ''
                      );
                    return (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-xs">
                        <div className="border border-slate-200 bg-slate-50 p-3">
                          <div className="text-slate-500">
                            {isFallbackUrl ? '官方院所目录入口 URL' : '导师本人主页 URL'}
                          </div>
                          <a
                            href={selectedAdvisorObj.labUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 block truncate font-mono text-[#00407A] hover:underline"
                          >
                            {selectedAdvisorObj.labUrl}
                          </a>
                        </div>
                        <div className="border border-slate-200 bg-slate-50 p-3">
                          <div className="text-slate-500">
                            {isOfficeEmail ? '院所招办联系邮箱（官网未单列个人邮箱）' : '导师本人联系邮箱'}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-slate-800 truncate">
                            <Mail className="h-3.5 w-3.5 text-[#006B77] shrink-0" />
                            <a
                              href={`mailto:${selectedAdvisorObj.email}`}
                              className="truncate hover:text-[#00407A] hover:underline"
                            >
                              {selectedAdvisorObj.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <div className="text-xs font-semibold text-slate-500">研究方向简介</div>
                    <p className="mt-1 text-sm text-slate-800 line-clamp-2">
                      {selectedAdvisorObj.researchSummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 text-xs">
                    <div>
                      <div className="font-semibold text-slate-500">招生专业目录</div>
                      <div className="mt-1.5 space-y-1 text-slate-800">
                        {selectedAdvisorObj.recruitingMajors.length > 0 ? (
                          selectedAdvisorObj.recruitingMajors.map((m) => (
                            <div key={m} className="font-mono">
                              • {m}
                            </div>
                          ))
                        ) : (
                          <div>详见研究所当年统考目录</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-500">研究脉络 / 关键词</div>
                      <div className="mt-1.5 space-y-1 text-slate-700">
                        {selectedAdvisorObj.recentPapersContext.length > 0 ? (
                          selectedAdvisorObj.recentPapersContext.map((p, idx) => (
                            <div key={idx}>• {p}</div>
                          ))
                        ) : (
                          <div>• 关键词：{selectedAdvisorObj.keywords.join('、')}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">仅提供客观导师名录检索查询。</span>
                    <button
                      type="button"
                      onClick={() => handleAnalyzeSelectedProfile(selectedAdvisorObj)}
                      className="metro-tile inline-flex items-center gap-1.5 bg-[#AD1E24] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#8E161B]"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>生成文献检索指引</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                  请在左侧选择一位导师查看官方档案与主页链接。
                </div>
              )}

              {deepProfile && deepProfile.advisorName === selectedAdvisorObj?.name && (
                <div className="border border-slate-200 bg-white p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                    <span className="font-bold text-[#00407A]">{deepProfile.advisorName}</span>
                    <span className="text-slate-500">{deepProfile.instituteName}</span>
                  </div>
                  <p className="text-xs text-slate-700">{deepProfile.plainLanguageResearch}</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {deepProfile.threeYearBreakthroughs?.map((b, i) => (
                      <div key={i} className="border border-slate-200 bg-slate-50 p-3 text-xs">
                        <div className="font-mono text-[#006B77]">{b.yearOrTheme}</div>
                        <div className="mt-0.5 font-bold text-slate-900">{b.breakthroughTitle}</div>
                        <p className="mt-1 text-slate-600">{b.significance}</p>
                      </div>
                    ))}
                  </div>
                  {deepProfile.researchPrepGuide?.length > 0 && (
                    <div className="border-t border-slate-100 pt-2.5 text-xs space-y-1">
                      {deepProfile.researchPrepGuide.map((g, i) => (
                        <div key={i} className="text-slate-600">
                          <strong className="text-slate-800">{g.topic}：</strong>
                          {g.readingSuggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
