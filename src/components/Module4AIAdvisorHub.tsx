/**
 * @file Module4AIAdvisorHub.tsx
 * @description 模块四：三级级联理想方向探索、全库关键词查方向与 62 所生物导师名录中心
 * 1. 基于内置全量三级学科图谱与 3,089 位导师方向语料库匹配，按相关度从高到低排序精选 10-20 个官方招生方向。
 * 2. 工作区 1（三级级联同屏看板）：生物学领域 -> 研究方向 -> 细分小方向，关联全部 62 所 × 241 条官方招生方向，
 *    止步于【报考院系所 -> 报考专业代码及名称 -> 官方招生方向】。
 * 3. 工作区 2（兴趣关键词查方向）：需先完成三级探索后解锁，检索全库 62 所 × 241 条官方招生方向（按相关度精选前 20 条）。
 * 4. 工作区 3（62 所生物导师名录）：纯客观目录查询，支持按研究所切换与分页检索。
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
import { CAS_ADVISORS } from '../data/casAdvisors';
import { CAS_INSTITUTES } from '../data/casInstitutes';
import { RESEARCH_EXPLORATION_TREE } from '../data/casResearchTree';
import {
  AIAdvisorDeepProfile,
  AIAdvisorMatchResponse,
  AIDirectionReport,
  CasAdvisor,
  ResearchQuizAnswers,
} from '../types/cas';
import {
  countCorpusMatchesForNode,
  filterAndPaginateAdvisors,
  generateLocalDirectionReport,
  getAdvisorCorpusStats,
  matchTeamsLocally,
} from '../utils/casFilters';

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
  const [level1Id, setLevel1Id] = useState<string>(RESEARCH_EXPLORATION_TREE[0].id);
  const [level2Id, setLevel2Id] = useState<string>(
    RESEARCH_EXPLORATION_TREE[0].directions[0].id
  );
  const [level3Id, setLevel3Id] = useState<string>(
    RESEARCH_EXPLORATION_TREE[0].directions[0].subSpecialties[0].id
  );

  const activeLevel1 = useMemo(
    () => RESEARCH_EXPLORATION_TREE.find((d) => d.id === level1Id) ?? RESEARCH_EXPLORATION_TREE[0],
    [level1Id]
  );
  const activeLevel2 = useMemo(
    () => activeLevel1.directions.find((d) => d.id === level2Id) ?? activeLevel1.directions[0],
    [activeLevel1, level2Id]
  );
  const activeLevel3 = useMemo(
    () =>
      activeLevel2.subSpecialties.find((s) => s.id === level3Id) ??
      activeLevel2.subSpecialties[0],
    [activeLevel2, level3Id]
  );

  const [extraNotes, setExtraNotes] = useState('');
  const [resultFilterQuery, setResultFilterQuery] = useState('');
  const [quizReport, setQuizReport] = useState<AIDirectionReport | null>(null);

  const handleSelectLevel1 = (id: string) => {
    const dom = RESEARCH_EXPLORATION_TREE.find((d) => d.id === id);
    if (!dom) return;
    const d2 = dom.directions[0];
    const d3 = d2.subSpecialties[0];
    setLevel1Id(dom.id);
    setLevel2Id(d2.id);
    setLevel3Id(d3.id);
    setQuizReport(null);
  };

  const handleSelectLevel2 = (id: string) => {
    const d2 = activeLevel1.directions.find((d) => d.id === id);
    if (!d2) return;
    const d3 = d2.subSpecialties[0];
    setLevel2Id(d2.id);
    setLevel3Id(d3.id);
    setQuizReport(null);
  };

  const handleSelectLevel3 = (id: string) => {
    const d3 = activeLevel2.subSpecialties.find((s) => s.id === id);
    if (!d3) return;
    setLevel3Id(d3.id);
    setQuizReport(null);
  };

  const handleRunDirectionQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    setResultFilterQuery('');

    const answers: ResearchQuizAnswers = {
      level1DomainId: activeLevel1.id,
      level1Domain: activeLevel1.name,
      level2DirectionId: activeLevel2.id,
      level2Direction: activeLevel2.name,
      level3SubSpecialtyId: activeLevel3.id,
      level3SubSpecialty: activeLevel3.name,
      extraNotes,
    };

    const report = generateLocalDirectionReport(answers);
    setQuizReport(report);
    onCompleteDirectionQuiz(`三级方向探索（${activeLevel3.name}）：${report.headline}`);
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

  const corpusStats = useMemo(() => getAdvisorCorpusStats(), []);
  const activeNodeCorpus = useMemo(
    () => countCorpusMatchesForNode(activeLevel3),
    [activeLevel3]
  );

  // === 工作区 2：兴趣关键词查全库招生方向（需先完成三级探索后解锁） ===
  const [teamKeyword, setTeamKeyword] = useState('');
  const [teamMatchError, setTeamMatchError] = useState<string | null>(null);
  const [teamMatchResult, setTeamMatchResult] = useState<AIAdvisorMatchResponse | null>(null);

  const handleRunTeamMatch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!directionQuizCompleted) return;
    const query = teamKeyword.trim();
    if (!query) {
      setTeamMatchError('请输入研究兴趣关键词、专业代码或学科词后再检索。');
      return;
    }
    setTeamMatchError(null);
    setTeamMatchResult(matchTeamsLocally(query));
  };

  // === 工作区 3：62 所生物导师名录（按研究所分页检索，纯客观名录查询） ===
  const instituteCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const adv of CAS_ADVISORS) {
      map.set(adv.instituteId, (map.get(adv.instituteId) ?? 0) + 1);
    }
    return map;
  }, []);

  const [dirInstituteId, setDirInstituteId] = useState<string>('ioz');
  const [dirSearchQuery, setDirSearchQuery] = useState<string>('');
  const [dirDegreeLevel, setDirDegreeLevel] = useState<'ALL' | '硕士' | '博士'>('ALL');
  const [dirPage, setDirPage] = useState<number>(1);
  const [selectedAdvisorObj, setSelectedAdvisorObj] = useState<CasAdvisor | null>(
    () => CAS_ADVISORS.find((a) => a.instituteId === 'ioz') ?? CAS_ADVISORS[0] ?? null
  );

  const [deepProfile, setDeepProfile] = useState<AIAdvisorDeepProfile | null>(null);

  const paginatedDirectory = useMemo(
    () =>
      filterAndPaginateAdvisors(CAS_ADVISORS, {
        instituteId: dirInstituteId,
        searchQuery: dirSearchQuery,
        degreeLevel: dirDegreeLevel,
        page: dirPage,
        pageSize: DIRECTORY_PAGE_SIZE,
      }),
    [dirInstituteId, dirSearchQuery, dirDegreeLevel, dirPage]
  );

  useEffect(() => {
    setDirPage(1);
  }, [dirInstituteId, dirSearchQuery, dirDegreeLevel]);

  const handleSelectDirectoryAdvisor = (adv: CasAdvisor) => {
    setSelectedAdvisorObj(adv);
    if (deepProfile?.advisorName !== adv.name) {
      setDeepProfile(null);
    }
  };

  const handleAnalyzeSelectedProfile = (adv: CasAdvisor) => {
    const plainResearch =
      adv.researchSummary ||
      `${adv.name} 课题组隶属于 ${adv.instituteName}（${adv.department}），当前在 ${adv.recruitingMajors.join('、') || '生物学相关专业'} 招收研究生。`;

    const profile: AIAdvisorDeepProfile = {
      advisorName: adv.name,
      instituteName: adv.instituteName,
      plainLanguageResearch: plainResearch,
      threeYearBreakthroughs:
        adv.recentPapersContext.length > 0
          ? adv.recentPapersContext.map((p, i) => ({
              yearOrTheme: `公开脉络 0${i + 1}`,
              breakthroughTitle: p.split(':')[0] || '代表性研究方向',
              significance: p,
            }))
          : [
              {
                yearOrTheme: '官方公开方向',
                breakthroughTitle: adv.keywords.join(' / ') || adv.department,
                significance: '完整论文列表与年度课题进展请点击“访问官方招生/主页”查阅。',
              },
            ],
      researchPrepGuide: [
        {
          topic: `学科基础对齐（${adv.keywords.slice(0, 2).join('、') || adv.department}）`,
          rationale: '结合所报专业初试科目与核心实验技术建立知识关联。',
          readingSuggestion: `可在 PubMed 或国自然基金库检索 "${adv.name}" 与 "${adv.instituteName.replace('中国科学院', '')}" 阅读英文原著摘要。`,
        },
      ],
      emailPitchTip: '请结合课题组近年发表论文摘要与官方主页信息核实研究细节。',
    };

    setDeepProfile(profile);
    onSaveAiSummaryForWhitepaper(`${adv.name} 公开方向摘要：${plainResearch.slice(0, 110)}...`);
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
            3. 62所导师名录（{CAS_ADVISORS.length}位）
          </button>
        </div>
      </div>

      {/* =================================================================
          工作区 1：三级级联同屏看板（L1领域 -> L2方向 -> L3细分小方向）
         ================================================================= */}
      {workspace === 'quiz' && (
        <div className="space-y-5">
          {/* 当前三级级联路径面包屑 + 3,089 导师方向实时汇聚统计 */}
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
              {activeNodeCorpus.matchingAdvisorCount} 项相近方向语料
            </span>
          </div>

          {/* 三级级联同屏三列面板 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Level 1 */}
            <div className="border border-slate-200 bg-white flex flex-col">
              <div className="border-b border-slate-200 bg-slate-50 px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-[#00407A]">1级 · 生物学研究领域</span>
                <span className="font-mono text-[11px] text-slate-500">
                  {RESEARCH_EXPLORATION_TREE.length} 类
                </span>
              </div>
              <div className="p-2 space-y-1.5 max-h-[380px] overflow-y-auto">
                {RESEARCH_EXPLORATION_TREE.map((dom) => {
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

          {/* 精简表单：补充偏好与提交按钮 */}
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
              className="metro-tile shrink-0 inline-flex items-center justify-center gap-2 bg-[#00407A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002B54] whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4" />
              <span>完成三级探索 · 精选高相关方向</span>
            </button>
          </form>

          {/* 匹配结果：按相关度从高到低排序，展示精选 10-20 个院系所 + 专业代码 + 官方方向 */}
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
                  className="metro-tile inline-flex items-center justify-center gap-2 bg-[#006B77] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#005862] whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>检索全库招生方向</span>
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
          工作区 3：62 所全量生物导师名录（按研究所分页检索，纯客观名录查询）
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
                  <option value="ALL">全部 62 所培养单位名录（{CAS_ADVISORS.length} 位）</option>
                  {CAS_INSTITUTES.map((inst) => {
                    const cnt = instituteCounts.get(inst.id) ?? 0;
                    return (
                      <option key={inst.id} value={inst.id}>
                        {inst.name}（{cnt} 位）
                      </option>
                    );
                  })}
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
            {/* 左侧：按研究所分页的客观名录 */}
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
