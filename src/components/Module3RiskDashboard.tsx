/**
 * @file Module3RiskDashboard.tsx
 * @description 模块三：2026-2025-2024 三年度统考招生与官方分数线看板
 * 所有 714 条分数线数据与四区间算法均在服务端 /api/risks 中执行，前端仅展示分页结果与区间视图。
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  INSTITUTE_DIFFICULTY_META,
  INSTITUTE_DIFFICULTY_TIERS,
  REGION_OPTIONS,
} from '../constants/uiMeta';
import {
  InstituteDifficultyTier,
  RegionZone,
  RiskRecordPageItem,
} from '../types/cas';

interface Module3RiskDashboardProps {
  initialSearchKeyword: string;
}

type SortDirection = 'asc' | 'desc' | 'none';

interface RisksApiResponse {
  items: RiskRecordPageItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  summaryStats: {
    total: number;
    withThreshold: number;
    withRatio: number;
    hotCount: number;
  };
  totalRecordsCount: number;
}

const NO_DATA_LABEL = '暂无数据';
const PAGE_SIZE = 30;

export const Module3RiskDashboard: React.FC<Module3RiskDashboardProps> = ({
  initialSearchKeyword,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchKeyword);
  const [yearFilter, setYearFilter] = useState<number | 'ALL'>(initialSearchKeyword ? 'ALL' : 2026);
  const [regionFilter, setRegionFilter] = useState<RegionZone | 'ALL'>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<InstituteDifficultyTier | 'ALL'>('ALL');
  const [thresholdSort, setThresholdSort] = useState<SortDirection>('desc');
  const [ratioSort, setRatioSort] = useState<SortDirection>('none');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [mockUserScoreInput, setMockUserScoreInput] = useState<string>('');
  const [targetZoneFilter, setTargetZoneFilter] = useState<'PASSED' | 'ALL' | 1 | 2 | 3 | 4>(
    'PASSED'
  );

  const [pageItems, setPageItems] = useState<RiskRecordPageItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    withThreshold: 0,
    withRatio: 0,
    hotCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState<number>(0);

  useEffect(() => {
    if (initialSearchKeyword) {
      setSearchQuery(initialSearchKeyword);
      setYearFilter('ALL');
      setCurrentPage(1);
    }
  }, [initialSearchKeyword]);

  const parsedUserScore = useMemo(() => {
    const trimmed = mockUserScoreInput.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0 || n > 500) return null;
    return n;
  }, [mockUserScoreInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    yearFilter,
    searchQuery,
    regionFilter,
    difficultyFilter,
    parsedUserScore,
    targetZoneFilter,
    thresholdSort,
    ratioSort,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setApiError(null);
      const params = new URLSearchParams();
      params.set('year', String(yearFilter));
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (regionFilter !== 'ALL') params.set('region', regionFilter);
      if (difficultyFilter !== 'ALL') params.set('difficulty', difficultyFilter);
      if (parsedUserScore !== null) params.set('targetScore', String(parsedUserScore));
      params.set('targetZone', String(targetZoneFilter));
      params.set('thresholdSort', thresholdSort);
      params.set('ratioSort', ratioSort);
      params.set('page', String(currentPage));
      params.set('pageSize', String(PAGE_SIZE));

      fetch(`/api/risks?${params.toString()}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((data: RisksApiResponse) => {
          setPageItems(data.items);
          setTotalCount(data.totalCount);
          setTotalPages(data.totalPages);
          setSummaryStats(data.summaryStats);
          if (data.items.length > 0) {
            setExpandedRowId((prev) =>
              prev && data.items.some((it) => it.record.id === prev)
                ? prev
                : data.items[0].record.id
            );
          } else {
            setExpandedRowId(null);
          }
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            setPageItems([]);
            setApiError('分数线数据服务请求失败，请检查服务端状态后点击重试。');
          }
        })
        .finally(() => setLoading(false));
    }, searchQuery || mockUserScoreInput ? 120 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    yearFilter,
    searchQuery,
    regionFilter,
    difficultyFilter,
    parsedUserScore,
    targetZoneFilter,
    thresholdSort,
    ratioSort,
    currentPage,
    mockUserScoreInput,
    reloadTick,
  ]);

  const safePage = Math.min(currentPage, totalPages);

  const cycleThresholdSort = () => {
    setRatioSort('none');
    setThresholdSort((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const cycleRatioSort = () => {
    setThresholdSort('none');
    setRatioSort((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setYearFilter(2026);
    setRegionFilter('ALL');
    setDifficultyFilter('ALL');
    setMockUserScoreInput('');
    setTargetZoneFilter('PASSED');
  };

  const renderDifficultyTag = (item: RiskRecordPageItem) => {
    if (item.metrics.prelimThreshold === null) {
      return (
        <span className="inline-flex items-center gap-1 font-medium text-slate-400">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>{NO_DATA_LABEL}</span>
        </span>
      );
    }
    const tier = item.metrics.zoneTier;
    const meta = INSTITUTE_DIFFICULTY_META[tier];
    return (
      <span
        className={`inline-block px-2 py-0.5 font-mono text-[11px] font-bold tracking-tight ${meta.badgeBg} ${meta.badgeText}`}
      >
        {tier}
      </span>
    );
  };

  const renderNum = (val: number | null, suffix = '') =>
    val === null ? (
      <span className="text-slate-400 font-sans font-normal">{NO_DATA_LABEL}</span>
    ) : (
      `${val}${suffix}`
    );

  return (
    <section aria-label="模块三：分数线看板" className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          分数线看板
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          汇总 62 所院系所 2026 / 2025 / 2024 年官方复试总分线与五档难度。
        </p>
      </div>

      {apiError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 border border-[#AD1E24] bg-red-50 px-4 py-3 text-xs text-[#AD1E24]"
        >
          <span>{apiError}</span>
          <button
            type="button"
            onClick={() => setReloadTick((n) => n + 1)}
            className="bg-[#AD1E24] px-3 py-1 font-semibold text-white hover:bg-[#8E161B]"
          >
            重试加载
          </button>
        </div>
      )}

      {/* 统计概览条 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs text-slate-500">当前筛选专业记录</div>
          <div className="mt-1 font-mono text-xl font-bold text-[#00407A] tabular-nums">
            {summaryStats.total} <span className="text-xs font-normal text-slate-500">条</span>
          </div>
        </div>
        <div className="border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs text-slate-500">已核验复试总分线</div>
          <div className="mt-1 font-mono text-xl font-bold text-[#006B77] tabular-nums">
            {summaryStats.withThreshold}{' '}
            <span className="text-xs font-normal text-slate-500">条</span>
          </div>
        </div>
        <div className="border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs text-slate-500">含复试/拟录或比例口径</div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-900 tabular-nums">
            {summaryStats.withRatio} <span className="text-xs font-normal text-slate-500">条</span>
          </div>
        </div>
        <div className="border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs text-slate-500">Extreme / Ultra 高难度档</div>
          <div className="mt-1 font-mono text-xl font-bold text-[#AD1E24] tabular-nums">
            {summaryStats.hotCount} <span className="text-xs font-normal text-slate-500">条</span>
          </div>
        </div>
      </div>

      {/* 工具栏：搜索 + 年份 + 区域 + 难度 + 排序 + 分数区间定位反查 */}
      <div className="border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                aria-label="筛选院所、专业代码或方向"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="筛选院所、简称、专业代码或科目（如：植物所 / 医学院 / 071001）..."
                className="w-full border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-[#00407A] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex border border-slate-300 text-xs">
              {([2026, 2025, 2024, 'ALL'] as const).map((yr, idx) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setYearFilter(yr)}
                  className={`px-3 py-2 font-semibold whitespace-nowrap ${
                    yearFilter === yr
                      ? 'bg-[#00407A] text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  } ${idx > 0 ? 'border-l border-slate-300' : ''}`}
                >
                  {yr === 'ALL' ? '全部三年' : `${yr} 届`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRatioSort('none');
                setThresholdSort('asc');
              }}
              className={`metro-tile inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap ${
                thresholdSort === 'asc'
                  ? 'bg-[#006B77] text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ArrowUpNarrowWide className="h-3.5 w-3.5" />
              <span>总分线升序</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRatioSort('none');
                setThresholdSort('desc');
              }}
              className={`metro-tile inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap ${
                thresholdSort === 'desc'
                  ? 'bg-[#AD1E24] text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ArrowDownWideNarrow className="h-3.5 w-3.5" />
              <span>总分线降序</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>重置</span>
            </button>
          </div>
        </div>

        {/* 第二行：按区域筛选 + 按报考难度筛选 */}
        <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 lg:grid-cols-12">
          <div className="lg:col-span-5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600 mr-1">区域筛选：</span>
            <button
              type="button"
              onClick={() => setRegionFilter('ALL')}
              className={`px-2.5 py-1.5 font-semibold border whitespace-nowrap ${
                regionFilter === 'ALL'
                  ? 'border-[#00407A] bg-[#00407A] text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              全部区域
            </button>
            {REGION_OPTIONS.map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setRegionFilter(reg)}
                className={`px-2.5 py-1.5 font-semibold border whitespace-nowrap ${
                  regionFilter === reg
                    ? 'border-[#00407A] bg-[#00407A] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          <div className="lg:col-span-7 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600 mr-1">报考难度：</span>
            <button
              type="button"
              onClick={() => setDifficultyFilter('ALL')}
              className={`px-2.5 py-1.5 font-semibold border whitespace-nowrap ${
                difficultyFilter === 'ALL'
                  ? 'border-[#00407A] bg-[#00407A] text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              全部难度
            </button>
            {INSTITUTE_DIFFICULTY_TIERS.map((tier) => {
              const meta = INSTITUTE_DIFFICULTY_META[tier];
              const active = difficultyFilter === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setDifficultyFilter(tier)}
                  className={`px-2.5 py-1.5 font-mono font-bold border whitespace-nowrap ${
                    active
                      ? `${meta.badgeBg} ${meta.badgeText} border-transparent`
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        </div>

        {/* 第三行：输入某个分数，筛选该分数下能位于区间 1 / 2 / 3 / 4 的院系所专业 */}
        <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-3 lg:flex-row lg:items-center lg:justify-between bg-[#F8FAFC] p-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <label htmlFor="m3-score-filter" className="font-bold text-[#00407A] whitespace-nowrap">
              按总分定位/筛选区间：
            </label>
            <input
              id="m3-score-filter"
              type="number"
              min={0}
              max={500}
              value={mockUserScoreInput}
              onChange={(e) => setMockUserScoreInput(e.target.value)}
              placeholder="输入分数（如 340）"
              className="w-36 border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-[#00407A] tabular-nums placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:border-[#00407A] focus:outline-none"
            />
            {parsedUserScore !== null && (
              <span className="font-mono text-[11px] font-semibold text-[#006B77]">
                当前按 {parsedUserScore} 分筛选命中 {totalCount} 条
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {(
              [
                { value: 'PASSED', label: '区间 1–4（全部达线）' },
                { value: 1, label: '区间 1 · 危险擦线' },
                { value: 2, label: '区间 2 · 边缘博弈' },
                { value: 3, label: '区间 3 · 稳妥竞争' },
                { value: 4, label: '区间 4 · 高分优势' },
                { value: 'ALL', label: '显示全部（含未过线）' },
              ] as const
            ).map((opt) => {
              const active = targetZoneFilter === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setTargetZoneFilter(opt.value)}
                  className={`px-2.5 py-1.5 font-semibold border whitespace-nowrap transition-colors ${
                    active
                      ? opt.value === 1
                        ? 'border-[#AD1E24] bg-[#AD1E24] text-white'
                        : 'border-[#006B77] bg-[#006B77] text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 多维数据表 */}
      <div className="border border-slate-200 bg-white overflow-hidden">
        {loading && pageItems.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            正在加载分数线与四区间定位数据...
          </div>
        ) : pageItems.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-700">
              未匹配到符合当前年份、区域、难度或输入分数区间条件的院所与专业记录。
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 bg-[#00407A] px-4 py-2 text-xs font-semibold text-white"
            >
              重置筛选显示全部 238 专业数据
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <th className="py-3 pl-4 pr-2 w-8" aria-label="展开状态" />
                    <th className="py-3 px-2 whitespace-nowrap">年份</th>
                    <th className="py-3 px-3 min-w-[220px]">院所与统考专业</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">拟招生</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={cycleThresholdSort}
                        className="inline-flex items-center gap-1 font-bold text-[#00407A] hover:underline"
                      >
                        <span>复试总分线</span>
                        {thresholdSort === 'asc' ? '↑' : thresholdSort === 'desc' ? '↓' : ''}
                      </button>
                    </th>
                    {parsedUserScore !== null && (
                      <th className="py-3 px-3 whitespace-nowrap text-[#006B77]">
                        {parsedUserScore} 分所在区间
                      </th>
                    )}
                    <th className="py-3 px-3 min-w-[160px]">
                      <button
                        type="button"
                        onClick={cycleRatioSort}
                        className="inline-flex items-center gap-1 font-bold text-[#006B77] hover:underline"
                      >
                        <span>统考复试/拟录 · 复录比</span>
                        {ratioSort === 'asc' ? '↑' : ratioSort === 'desc' ? '↓' : ''}
                      </button>
                    </th>
                    <th className="py-3 px-3 min-w-[180px]">单科线与官方补充口径</th>
                    <th className="py-3 pl-2 pr-4 whitespace-nowrap">报考难度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageItems.map((item) => {
                    const rec = item.record;
                    const metrics = item.metrics;
                    const evalResult = item.scoreEval;
                    const isExpanded = expandedRowId === rec.id;
                    const axisMin = metrics.axisMin;
                    const axisMax = metrics.axisMax;
                    const span = Math.max(1, axisMax - axisMin);
                    const pct = (val: number) =>
                      Math.min(100, Math.max(0, ((val - axisMin) / span) * 100));

                    return (
                      <React.Fragment key={rec.id}>
                        <tr
                          onClick={() => setExpandedRowId(isExpanded ? null : rec.id)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded ? 'bg-[#F0F5FA]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 pl-4 pr-2 text-slate-400">
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              aria-label={`展开 ${rec.instituteName} ${rec.majorCode} 详情`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRowId(isExpanded ? null : rec.id);
                              }}
                              className="p-0.5 text-slate-600 hover:text-[#00407A]"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-2 font-mono text-slate-700 tabular-nums">{rec.year}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{rec.instituteName}</span>
                              {item.region && (
                                <span className="text-[10px] text-slate-500">{item.region}</span>
                              )}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              {rec.majorCode} {rec.majorName} ·{' '}
                              <span className="font-mono">{rec.subjectCombo}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                            {renderNum(rec.plannedQuota, ' 人')}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#00407A] tabular-nums">
                            {renderNum(rec.prelimThreshold, ' 分')}
                          </td>
                          {parsedUserScore !== null && (
                            <td className="py-3 px-3 whitespace-nowrap font-semibold">
                              {evalResult ? (
                                <span className={evalResult.textClass}>
                                  {evalResult.status === 'below'
                                    ? evalResult.detail
                                    : `${evalResult.status.replace('zone', '区间')} · ${evalResult.label}`}
                                </span>
                              ) : (
                                <span className="text-slate-400">{NO_DATA_LABEL}</span>
                              )}
                            </td>
                          )}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                            {rec.reexamRatioLabel && rec.reexamRatioLabel !== NO_DATA_LABEL ? (
                              <span className={rec.applicationRatio ? 'font-bold text-[#006B77]' : 'text-slate-700'}>
                                {rec.reexamRatioLabel}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-sans">{NO_DATA_LABEL}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 truncate max-w-[210px]" title={rec.singleLineNote}>
                            {rec.singleLineNote || NO_DATA_LABEL}
                          </td>
                          <td className="py-3 pl-2 pr-4 whitespace-nowrap">{renderDifficultyTag(item)}</td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td
                              colSpan={parsedUserScore !== null ? 9 : 8}
                              className="border-t border-slate-200 bg-[#F8FAFC] p-5"
                            >
                              <div className="space-y-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">
                                      {rec.instituteName} · {rec.majorCode} {rec.majorName}（{rec.year}届）
                                    </h4>
                                    <p className="mt-0.5 text-xs text-slate-600">{rec.riskNote}</p>
                                  </div>

                                  {metrics.prelimThreshold !== null && (
                                    <div className="flex flex-wrap items-center gap-3 border border-slate-200 bg-white px-3 py-2 shrink-0">
                                      <label
                                        htmlFor={`score-sim-${rec.id}`}
                                        className="text-xs font-semibold text-slate-700 whitespace-nowrap"
                                      >
                                        填写初试估分：
                                      </label>
                                      <input
                                        id={`score-sim-${rec.id}`}
                                        type="number"
                                        min={0}
                                        max={500}
                                        value={mockUserScoreInput}
                                        placeholder="输入估分"
                                        onChange={(e) => setMockUserScoreInput(e.target.value)}
                                        className="w-24 border border-slate-300 px-2 py-1 font-mono text-xs font-bold text-[#00407A] tabular-nums placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:border-[#00407A] focus:outline-none"
                                      />
                                      <span className="text-xs font-semibold whitespace-nowrap">
                                        {evalResult ? (
                                          <span className={evalResult.textClass}>{evalResult.detail}</span>
                                        ) : (
                                          <span className="text-slate-400 font-normal">
                                            输入分数判定所属区间
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {metrics.prelimThreshold !== null && metrics.scoreZones.length === 4 && (
                                  <div className="border border-slate-200 bg-white p-5 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-500 tabular-nums">
                                      <span>{axisMin} 分</span>
                                      <span className="font-mono font-bold text-slate-700">
                                        {metrics.zoneTier}
                                      </span>
                                      <span>{axisMax} 分</span>
                                    </div>

                                    <div className="relative mt-7 mb-9 h-7 w-full bg-slate-100 overflow-visible">
                                      {metrics.scoreZones.map((zone) => {
                                        const leftPct = pct(zone.startScore);
                                        const rightVal = zone.endScore ?? axisMax;
                                        const widthPct = Math.max(0.5, pct(rightVal) - leftPct);
                                        return (
                                          <div
                                            key={zone.zoneIndex}
                                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                            className={`absolute top-0 bottom-0 ${zone.barClass}`}
                                            title={`${zone.label}：${zone.startScore}–${zone.endScore ?? '500'} 分`}
                                          />
                                        );
                                      })}

                                      {metrics.scoreZones.map((zone, zIdx) => (
                                        <div
                                          key={`marker-${zone.zoneIndex}`}
                                          style={{ left: `${pct(zone.startScore)}%` }}
                                          className={`absolute -top-2 -bottom-2 w-0.5 ${
                                            zIdx === 0 ? 'bg-[#AD1E24]' : 'bg-slate-600/70'
                                          }`}
                                        >
                                          <div
                                            className={`absolute ${
                                              zIdx % 2 === 0 ? '-top-5' : '-bottom-5'
                                            } -translate-x-1/2 whitespace-nowrap font-mono text-[10px] font-bold ${
                                              zIdx === 0 ? 'text-[#AD1E24]' : 'text-slate-700'
                                            }`}
                                          >
                                            {zIdx === 0 ? `线 ${zone.startScore}` : `${zone.startScore}`}
                                          </div>
                                        </div>
                                      ))}

                                      {metrics.admittedMedian !== null && (
                                        <div
                                          style={{ left: `${pct(metrics.admittedMedian)}%` }}
                                          className="absolute -top-2 -bottom-2 w-0.5 bg-[#006B77]"
                                        >
                                          <div className="absolute -top-5 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] font-bold text-[#006B77]">
                                            录中位 {metrics.admittedMedian}
                                          </div>
                                        </div>
                                      )}

                                      {parsedUserScore !== null && (
                                        <div
                                          style={{ left: `${pct(parsedUserScore)}%` }}
                                          className="absolute -top-3 h-12 w-1 bg-[#AD1E24]"
                                        >
                                          <div className="absolute -bottom-7 -translate-x-1/2 whitespace-nowrap bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                                            估分 {parsedUserScore}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                                      {metrics.scoreZones.map((zone) => {
                                        const isCurrentZone =
                                          evalResult?.status === `zone${zone.zoneIndex}`;
                                        return (
                                          <div
                                            key={`card-${zone.zoneIndex}`}
                                            className={`border p-3 ${
                                              isCurrentZone
                                                ? 'border-[#00407A] bg-[#F0F5FA]'
                                                : zone.isDanger
                                                ? 'border-[#AD1E24]/50 bg-red-50/40'
                                                : 'border-slate-200 bg-slate-50'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between gap-1">
                                              <span className={`font-bold ${zone.textClass}`}>
                                                区间 {zone.zoneIndex} · {zone.label}
                                              </span>
                                              {zone.isDanger && (
                                                <AlertTriangle className="h-3.5 w-3.5 text-[#AD1E24] shrink-0" />
                                              )}
                                            </div>
                                            <div className="mt-1 font-mono font-bold text-slate-900 tabular-nums">
                                              {zone.endScore !== null
                                                ? `起始 ${zone.startScore} 分（${zone.startScore}–${zone.endScore - 1}）`
                                                : `起始 ${zone.startScore} 分（≥${zone.startScore}）`}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-4 border border-slate-200 bg-white p-4 text-xs">
                                  <div className="border border-slate-100 bg-slate-50 p-3">
                                    <div className="text-slate-500">拟招生与官方总分线</div>
                                    <div className="mt-1 font-bold text-[#00407A]">
                                      拟招 {rec.plannedQuota !== null ? `${rec.plannedQuota} 人` : NO_DATA_LABEL} · 总分线{' '}
                                      {rec.prelimThreshold !== null ? `${rec.prelimThreshold} 分` : NO_DATA_LABEL}
                                    </div>
                                  </div>
                                  <div className="border border-slate-100 bg-slate-50 p-3">
                                    <div className="text-slate-500">复试/拟录与复录比</div>
                                    <div className="mt-1 font-bold text-[#006B77]">
                                      {rec.reexamRatioLabel || NO_DATA_LABEL}
                                    </div>
                                    {rec.admittedMin !== null && (
                                      <div className="mt-0.5 font-mono text-[11px] text-slate-600">
                                        实录分位：{rec.admittedMin}–{rec.admittedMax}（中位 {rec.admittedMedian}）
                                      </div>
                                    )}
                                  </div>
                                  <div className="border border-slate-100 bg-slate-50 p-3">
                                    <div className="text-slate-500">单科线与官方补充口径</div>
                                    <div className="mt-1 font-medium text-slate-800">
                                      {rec.singleLineNote}
                                    </div>
                                  </div>
                                  <div className="border border-slate-100 bg-slate-50 p-3">
                                    <div className="text-slate-500">数据源核验</div>
                                    <div className="mt-1 text-slate-700">{rec.dataSourceNote}</div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 分页控制栏 */}
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="text-slate-600 font-mono tabular-nums">
                显示第 {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, totalCount)} 条，共{' '}
                {totalCount} 条记录（第 {safePage} / {totalPages} 页）
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>上一页</span>
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  <span>下一页</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
