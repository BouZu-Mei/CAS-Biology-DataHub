/**
 * @file Module5Whitepaper.tsx
 * @description 模块五：初试考纲资源与个人备考白皮书
 * 所有考纲书目、四区间计算与报考难度数据均通过服务端 /api/directions/options 与 /api/whitepaper/context 获取。
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookMarked,
  Download,
  ExternalLink,
  FileDown,
  PlayCircle,
  CheckCircle2,
  FileText,
  Search,
} from 'lucide-react';
import { INSTITUTE_DIFFICULTY_META } from '../constants/uiMeta';
import {
  DirectionOptionSummary,
  UserTargetPlan,
  WhitepaperContextResponse,
} from '../types/cas';
import { downloadSubjectSyllabusText, generateAndDownloadWhitepaperPDF } from '../utils/pdfWhitepaper';

interface Module5WhitepaperProps {
  targetPlan: UserTargetPlan;
  onUpdatePlan: (updater: (prev: UserTargetPlan) => UserTargetPlan) => void;
  aiInsightSummary?: string;
}

export const Module5Whitepaper: React.FC<Module5WhitepaperProps> = ({
  targetPlan,
  onUpdatePlan,
  aiInsightSummary,
}) => {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [dirSearchQuery, setDirSearchQuery] = useState('');

  const [directionOptions, setDirectionOptions] = useState<DirectionOptionSummary[]>([]);
  const [totalDirectionsCount, setTotalDirectionsCount] = useState<number>(241);
  const [contextData, setContextData] = useState<WhitepaperContextResponse | null>(null);
  const [loadingContext, setLoadingContext] = useState<boolean>(true);

  // 加载下拉选项列表
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/directions/options', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('options fetch error'))))
      .then((data: { items: DirectionOptionSummary[]; totalCount: number }) => {
        setDirectionOptions(data.items || []);
        setTotalDirectionsCount(data.totalCount || data.items?.length || 241);
      })
      .catch(() => {
        // 忽略中断错误
      });
    return () => controller.abort();
  }, []);

  // 按当前方向与目标分数从服务端获取考纲资源、难度等级与四区间划分
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoadingContext(true);
      const params = new URLSearchParams();
      if (targetPlan.directionId) params.set('directionId', targetPlan.directionId);
      if (Number.isFinite(targetPlan.customGoalScore)) {
        params.set('goalScore', String(targetPlan.customGoalScore));
      }

      fetch(`/api/whitepaper/context?${params.toString()}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('whitepaper context fetch error'))))
        .then((data: WhitepaperContextResponse) => {
          setContextData(data);
        })
        .catch(() => {
          // 忽略中断错误
        })
        .finally(() => setLoadingContext(false));
    }, 80);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [targetPlan.directionId, targetPlan.customGoalScore]);

  const filteredDirections = useMemo(() => {
    const q = dirSearchQuery.trim().toLowerCase();
    if (!q) return directionOptions;
    const tokens = q.split(/[\s,，/+]+/).filter(Boolean);
    return directionOptions.filter((dir) => {
      const hay = [
        dir.instituteName,
        dir.majorCode,
        dir.majorName,
        dir.directionName,
        dir.subject3Code,
        dir.subject3Name,
        dir.subject4Code,
        dir.subject4Name,
      ]
        .join(' ')
        .toLowerCase();
      return tokens.every((tk) => hay.includes(tk));
    });
  }, [dirSearchQuery, directionOptions]);

  const handleDirectionChange = (dirId: string) => {
    const dir = directionOptions.find((d) => d.id === dirId);
    if (!dir) return;
    const codes = [dir.subject3Code, dir.subject4Code].filter(
      (c) => c && c !== '无'
    );
    onUpdatePlan((prev) => ({
      ...prev,
      instituteId: dir.instituteId,
      directionId: dir.id,
      selectedSubjectCodes: codes,
    }));
  };

  const handleDirSearchChange = (value: string) => {
    setDirSearchQuery(value);
    const q = value.trim().toLowerCase();
    if (!q) return;
    const tokens = q.split(/[\s,，/+]+/).filter(Boolean);
    const matches = directionOptions.filter((dir) => {
      const hay = [
        dir.instituteName,
        dir.majorCode,
        dir.majorName,
        dir.directionName,
        dir.subject3Code,
        dir.subject3Name,
        dir.subject4Code,
        dir.subject4Name,
      ]
        .join(' ')
        .toLowerCase();
      return tokens.every((tk) => hay.includes(tk));
    });
    if (matches.length > 0 && !matches.some((d) => d.id === targetPlan.directionId)) {
      handleDirectionChange(matches[0].id);
    }
  };

  const selectedDirection = contextData?.direction ?? null;
  const selectedInstitute = contextData?.institute ?? null;
  const matchingRiskRecord = contextData?.riskRecord ?? null;
  const safetyMetrics = contextData?.safetyMetrics ?? null;
  const goalZoneEval = contextData?.goalZoneEval ?? null;
  const matchedResources = contextData?.resources ?? [];

  const activeSubjectCodes = useMemo(() => {
    if (!selectedDirection) return targetPlan.selectedSubjectCodes;
    return [selectedDirection.subjects.subject3Code, selectedDirection.subjects.subject4Code].filter(
      (c) => Boolean(c) && c !== '无'
    );
  }, [selectedDirection, targetPlan.selectedSubjectCodes]);

  const handleExportPdf = async () => {
    if (!selectedDirection || !selectedInstitute) return;
    setExportingPdf(true);
    setExportSuccessMessage(null);
    try {
      await generateAndDownloadWhitepaperPDF({
        plan: {
          ...targetPlan,
          instituteId: selectedDirection.instituteId,
          directionId: selectedDirection.id,
          selectedSubjectCodes: activeSubjectCodes,
        },
        institute: selectedInstitute,
        direction: selectedDirection,
        riskRecord: matchingRiskRecord,
        safetyMetrics,
        resources: matchedResources,
        aiInsightSummary,
      });
      setExportSuccessMessage('《中科院生物考研作战白皮书.pdf》已生成并触发下载。');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <section aria-label="模块五：初试考纲资源与个人备考白皮书" className="space-y-6">
      {/* 顶部栏 + 一键生成 PDF CTA */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            考纲资源与个人备考白皮书
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            汇总目标院所对应国科大官方考纲 PDF、原文参考书目与课程，一键导出作战白皮书。
          </p>
        </div>

        <button
          type="button"
          disabled={exportingPdf || !selectedDirection || !selectedInstitute}
          onClick={handleExportPdf}
          className="metro-tile shrink-0 inline-flex items-center gap-2 bg-[#AD1E24] px-5 py-3 text-sm font-bold text-white hover:bg-[#8E161B] disabled:opacity-60 whitespace-nowrap"
        >
          <FileDown className="h-4 w-4" />
          <span>{exportingPdf ? '正在排版渲染 PDF...' : '一键导出《中科院生物考研作战白皮书.pdf》'}</span>
        </button>
      </div>

      {exportSuccessMessage && (
        <div role="status" className="flex items-center gap-2 border border-[#006B77] bg-[#F0F9FA] p-3.5 text-xs font-semibold text-[#006B77]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{exportSuccessMessage}</span>
        </div>
      )}

      {/* 目标配置确认卡片（Metro 表单栏） */}
      <div className="border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">个人备考作战方案配置确认</h3>
          <span className="font-mono text-xs text-slate-500">所有修改将同步写入导出 PDF</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="wp-name" className="block text-xs font-semibold text-slate-600">
              考生称呼
            </label>
            <input
              id="wp-name"
              type="text"
              value={targetPlan.candidateName}
              onChange={(e) =>
                onUpdatePlan((prev) => ({ ...prev, candidateName: e.target.value }))
              }
              placeholder="输入姓名或昵称"
              className="mt-1 w-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#00407A] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="wp-dir" className="block text-xs font-semibold text-slate-600">
                目标院所 · 专业与科目组合
              </label>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                匹配 {filteredDirections.length} / {totalDirectionsCount}
              </span>
            </div>
            <div className="mt-1 space-y-1.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  id="wp-dir-search"
                  type="text"
                  aria-label="搜索目标院所、专业或科目代码"
                  value={dirSearchQuery}
                  onChange={(e) => handleDirSearchChange(e.target.value)}
                  placeholder="搜索院所、专业代码或科目（如 昆明动物 / 619 / 841）..."
                  className="w-full border border-slate-300 bg-white py-1.5 pl-8 pr-2.5 text-xs text-slate-900 focus:border-[#00407A] focus:outline-none"
                />
              </div>
              <select
                id="wp-dir"
                value={selectedDirection?.id ?? targetPlan.directionId}
                onChange={(e) => handleDirectionChange(e.target.value)}
                className="w-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#00407A] focus:outline-none"
              >
                {filteredDirections.length === 0 ? (
                  <option value={targetPlan.directionId}>
                    {selectedDirection
                      ? `无匹配方向，当前保留：${selectedDirection.instituteName} · ${selectedDirection.majorCode}`
                      : '正在加载报考方向列表...'}
                  </option>
                ) : (
                  filteredDirections.map((dir) => {
                    const combo =
                      dir.subject4Code && dir.subject4Code !== '无'
                        ? `${dir.subject3Code}+${dir.subject4Code}`
                        : `${dir.subject3Code}综合`;
                    return (
                      <option key={dir.id} value={dir.id}>
                        {dir.instituteName} · {dir.majorCode} {dir.majorName} ({combo})
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="wp-team" className="block text-xs font-semibold text-slate-600">
              锁定报考专业与方向
            </label>
            <input
              id="wp-team"
              type="text"
              value={targetPlan.targetTeamName}
              onChange={(e) =>
                onUpdatePlan((prev) => ({ ...prev, targetTeamName: e.target.value }))
              }
              placeholder={targetPlan.directionQuizCompleted ? '填入目标专业与方向' : '需先在模块四完成探索'}
              className="mt-1 w-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#00407A] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="wp-score" className="block text-xs font-semibold text-slate-600">
              初试目标总分（满分 500）
            </label>
            <input
              id="wp-score"
              type="number"
              min={240}
              max={460}
              value={targetPlan.customGoalScore}
              onChange={(e) =>
                onUpdatePlan((prev) => ({
                  ...prev,
                  customGoalScore: Number(e.target.value) || 350,
                }))
              }
              className="mt-1 w-full border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs font-bold text-[#00407A] tabular-nums focus:border-[#00407A] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 所选院所与专业报考难度及分数线四区间展示 */}
      {selectedInstitute && selectedDirection ? (() => {
        const tierMeta = INSTITUTE_DIFFICULTY_META[selectedInstitute.difficultyTier];
        const zones = safetyMetrics?.scoreZones ?? [];
        const axisMin = safetyMetrics?.axisMin ?? 240;
        const axisMax = safetyMetrics?.axisMax ?? 420;
        const span = Math.max(1, axisMax - axisMin);
        const pct = (val: number) => Math.min(100, Math.max(0, ((val - axisMin) / span) * 100));

        return (
          <div className="border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-900">
                  报考难度与分数线四区间定位
                </h3>
                <span
                  className={`inline-block px-2.5 py-0.5 font-mono text-xs font-bold ${tierMeta.badgeBg} ${tierMeta.badgeText}`}
                >
                  {tierMeta.tier}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                {matchingRiskRecord?.prelimThreshold !== null &&
                  matchingRiskRecord?.prelimThreshold !== undefined && (
                    <span className="font-mono font-semibold text-[#00407A] tabular-nums">
                      {matchingRiskRecord.year} 届公开复试总分线：{matchingRiskRecord.prelimThreshold} 分
                    </span>
                  )}
                {goalZoneEval && (
                  <span className={`font-semibold ${goalZoneEval.textClass}`}>
                    目标 {targetPlan.customGoalScore} 分：{goalZoneEval.detail}
                  </span>
                )}
              </div>
            </div>

            {zones.length === 4 ? (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 tabular-nums">
                    <span>{axisMin} 分</span>
                    <span className="font-sans text-slate-600">
                      {selectedInstitute.name} · {selectedDirection.majorCode} {selectedDirection.majorName}
                    </span>
                    <span>{axisMax} 分</span>
                  </div>

                  <div className="relative mt-6 mb-7 h-7 w-full bg-slate-100 overflow-visible">
                    {zones.map((zone) => {
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

                    {zones.map((zone, zIdx) => (
                      <div
                        key={`m5-marker-${zone.zoneIndex}`}
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

                    {Number.isFinite(targetPlan.customGoalScore) && (
                      <div
                        style={{ left: `${pct(targetPlan.customGoalScore)}%` }}
                        className="absolute -top-3 h-12 w-1 bg-[#00407A]"
                      >
                        <div className="absolute -bottom-7 -translate-x-1/2 whitespace-nowrap bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                          目标 {targetPlan.customGoalScore}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  {zones.map((zone) => {
                    const isGoalHere = goalZoneEval?.status === `zone${zone.zoneIndex}`;
                    return (
                      <div
                        key={`m5-zone-${zone.zoneIndex}`}
                        className={`border p-3 ${
                          isGoalHere
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
              </>
            ) : (
              <div className="border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                当前院所/专业暂无公开总分线，请结合院所 {tierMeta.tier} 难度档位做好高分备考准备。
              </div>
            )}
          </div>
        );
      })() : (
        <div className="border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
          {loadingContext ? '正在加载目标报考难度与四区间数据...' : '请选择目标专业方向'}
        </div>
      )}

      {/* 01. 已选定初试专业课考纲矩阵 */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900">
            01. 初试专业课考纲矩阵（{activeSubjectCodes.join(' + ')}）
          </h3>
          {selectedDirection && (
            <span className="text-xs text-slate-500">
              当前方向：{selectedDirection.instituteName} · {selectedDirection.majorCode}{' '}
              {selectedDirection.majorName}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {matchedResources.map((res) => (
            <div key={res.subjectCode} className="border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-[#00407A]">
                    SUBJECT {res.subjectCode}
                  </span>
                  <h4 className="mt-0.5 text-lg font-bold text-slate-900">{res.subjectName}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadSubjectSyllabusText(res)}
                    className="metro-tile inline-flex items-center gap-1.5 bg-[#00407A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#002B54]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>下载考纲精要 (.txt)</span>
                  </button>
                  <a
                    href={res.officialSyllabusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-[#00407A]"
                  >
                    <span>国科大官方考纲 PDF</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-[#00407A]" />
                  <span>考纲核心考察范围</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs leading-relaxed text-slate-600">
                  {res.syllabusSummary.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 02. 推荐视频课程与核心参考书目 */}
      <div className="border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">02. 推荐视频课程与官方考纲参考书目</h3>
          <span className="text-xs text-slate-500">参考书目均核自国科大考纲 PDF 原文</span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {matchedResources.map((res) => (
            <div key={`comp-${res.subjectCode}`} className="border border-slate-200 bg-[#F8FAFC] p-4 space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <span className="font-mono text-xs font-bold text-[#00407A]">
                  {res.subjectCode} {res.subjectName}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <PlayCircle className="h-3.5 w-3.5 text-[#006B77]" />
                  <span>推荐视频课程（B站 / 中国大学MOOC）</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {res.videoCourses.map((vc, idx) => (
                    <a
                      key={idx}
                      href={vc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 border border-slate-200 bg-white px-3 py-2 text-xs hover:border-[#006B77]"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-[#006B77]">[{vc.platform}]</span>{' '}
                        <span className="font-medium text-slate-900">{vc.title}</span>
                        <span className="ml-2 text-slate-500">· {vc.instructor}</span>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <BookMarked className="h-3.5 w-3.5 text-[#AD1E24]" />
                  <span>官方考纲参考书目</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {res.textbooks.length > 0 ? (
                    res.textbooks.map((tb, idx) => (
                      <div
                        key={idx}
                        className="border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                      >
                        <span className="font-bold text-slate-900">《{tb.title}》</span>
                        <span className="text-slate-600"> — {tb.author}</span>
                        <span className="ml-2 text-slate-500">
                          {tb.publisher} · {tb.edition}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                      {res.syllabusRefNote || '官方考纲原文未单列具体书名'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
