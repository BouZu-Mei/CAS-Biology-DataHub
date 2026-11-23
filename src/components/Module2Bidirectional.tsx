/**
 * @file Module2Bidirectional.tsx
 * @description 模块二：初试科目与院所双向检索
 * 全部 241 条统考方向与科目反查均通过服务端 /api/bidirectional 接口完成。
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Check, RotateCcw, Search, Layers, Target } from 'lucide-react';
import { AdmissionDirection, ExamSubject } from '../types/cas';

interface Module2BidirectionalProps {
  initialInstituteFilter: string | 'ALL';
  activeTargetDirectionId: string;
  onSelectAsTarget: (direction: AdmissionDirection) => void;
}

interface InstituteOption {
  id: string;
  name: string;
  shortName: string;
  code: string;
  city: string;
}

interface BidirectionalApiResponse {
  directions: AdmissionDirection[];
  totalCount: number;
  totalDirectionsCount: number;
  examSubjects: ExamSubject[];
  instituteOptions: InstituteOption[];
}

export const Module2Bidirectional: React.FC<Module2BidirectionalProps> = ({
  initialInstituteFilter,
  activeTargetDirectionId,
  onSelectAsTarget,
}) => {
  const [selectedSubjectCodes, setSelectedSubjectCodes] = useState<string[]>(['338', '888']);
  const [matchMode, setMatchMode] = useState<'ALL' | 'ANY'>('ALL');
  const [instituteId, setInstituteId] = useState<string | 'ALL'>(initialInstituteFilter);
  const [instQuickFilter, setInstQuickFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [degreeType, setDegreeType] = useState<'ALL' | '学术型硕士' | '专业型硕士'>('ALL');
  const [onlyJoint, setOnlyJoint] = useState(false);

  const [directions, setDirections] = useState<AdmissionDirection[]>([]);
  const [totalDirectionsCount, setTotalDirectionsCount] = useState<number>(241);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [instituteOptions, setInstituteOptions] = useState<InstituteOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (initialInstituteFilter !== 'ALL') {
      setInstituteId(initialInstituteFilter);
      setSelectedSubjectCodes([]);
    }
  }, [initialInstituteFilter]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSubjectCodes.length > 0) params.set('subjects', selectedSubjectCodes.join(','));
      params.set('matchMode', matchMode);
      if (instituteId !== 'ALL') params.set('instituteId', instituteId);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (degreeType !== 'ALL') params.set('degreeType', degreeType);
      if (onlyJoint) params.set('onlyJoint', 'true');

      fetch(`/api/bidirectional?${params.toString()}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bidirectional fetch error'))))
        .then((data: BidirectionalApiResponse) => {
          setDirections(data.directions);
          setTotalDirectionsCount(data.totalDirectionsCount);
          if (data.examSubjects?.length) setExamSubjects(data.examSubjects);
          if (data.instituteOptions?.length) setInstituteOptions(data.instituteOptions);
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            setDirections([]);
          }
        })
        .finally(() => setLoading(false));
    }, searchQuery ? 120 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [selectedSubjectCodes, matchMode, instituteId, searchQuery, degreeType, onlyJoint]);

  const toggleSubject = (code: string) => {
    setSelectedSubjectCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const availableInstitutes = useMemo(() => {
    const q = instQuickFilter.trim().toLowerCase();
    if (!q) return instituteOptions;
    return instituteOptions.filter(
      (inst) =>
        inst.shortName.toLowerCase().includes(q) ||
        inst.name.toLowerCase().includes(q) ||
        inst.code.includes(q) ||
        inst.city.toLowerCase().includes(q)
    );
  }, [instQuickFilter, instituteOptions]);

  const groupedByInstitute = useMemo(() => {
    const map = new Map<string, { title: string; items: AdmissionDirection[] }>();
    for (const dir of directions) {
      const key = dir.instituteName;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(dir);
      } else {
        map.set(key, { title: dir.instituteName, items: [dir] });
      }
    }
    return Array.from(map.entries());
  }, [directions]);

  const resetAllFilters = () => {
    setSelectedSubjectCodes([]);
    setInstituteId('ALL');
    setInstQuickFilter('');
    setSearchQuery('');
    setDegreeType('ALL');
    setOnlyJoint(false);
  };

  return (
    <section aria-label="模块二：初试科目与院所双向检索" className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          初试科目与院所双向检索
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          覆盖 {instituteOptions.length || 62} 所培养单位共 {totalDirectionsCount} 条统考方向，支持按科目反查院所或按院所查全量方向。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 左侧：科目反向筛选控制台 */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">01. 勾选目标初试专业课</h3>
              {selectedSubjectCodes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSubjectCodes([])}
                  className="text-xs font-medium text-[#00407A] hover:underline"
                >
                  清空科目
                </button>
              )}
            </div>

            <div className="mt-3 flex border border-slate-300 text-xs">
              <button
                type="button"
                onClick={() => setMatchMode('ALL')}
                className={`flex-1 py-1.5 font-semibold ${
                  matchMode === 'ALL' ? 'bg-[#00407A] text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                同时包含所选科目
              </button>
              <button
                type="button"
                onClick={() => setMatchMode('ANY')}
                className={`flex-1 border-l border-slate-300 py-1.5 font-semibold ${
                  matchMode === 'ANY' ? 'bg-[#00407A] text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                包含任一科目即可
              </button>
            </div>

            <div className="mt-3 space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {examSubjects.map((subj) => {
                const checked = selectedSubjectCodes.includes(subj.code);
                return (
                  <label
                    key={subj.code}
                    className={`metro-tile flex cursor-pointer items-start gap-2.5 border p-2.5 text-xs transition-colors ${
                      checked
                        ? 'border-[#00407A] bg-[#F0F5FA]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSubject(subj.code)}
                      className="mt-0.5 h-4 w-4 accent-[#00407A]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          <span className="font-mono text-[#00407A]">{subj.code}</span> {subj.name}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {subj.setter} · {subj.category}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">02. 按院所/专项一键展开</h3>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                {instituteOptions.length || 62} 所
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              点击院所展开下属全部方向与科目
            </p>
            <input
              type="text"
              aria-label="快速筛选院所按钮"
              value={instQuickFilter}
              onChange={(e) => setInstQuickFilter(e.target.value)}
              placeholder="过滤院所名（如：杭州医学 / 海洋 / 药物所）..."
              className="mt-2.5 w-full border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#006B77] focus:bg-white focus:outline-none"
            />
            <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-[240px] overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setInstituteId('ALL')}
                className={`px-2.5 py-1.5 text-xs font-medium ${
                  instituteId === 'ALL'
                    ? 'bg-[#006B77] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                全部院所
              </button>
              {availableInstitutes.map((inst) => (
                <button
                  key={inst.id}
                  type="button"
                  onClick={() => {
                    setInstituteId(inst.id);
                    setSelectedSubjectCodes([]);
                  }}
                  className={`px-2.5 py-1.5 text-xs font-medium ${
                    instituteId === inst.id
                      ? 'bg-[#006B77] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {inst.shortName}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* 右侧：检索栏 + 双向匹配结果面板 */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-6 relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  aria-label="搜索院所、专业代码或研究方向"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜专业代码（071000 / 086000 / 1001）、院所或方向..."
                  className="w-full border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-[#00407A] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4 flex items-center gap-1.5">
                {(['ALL', '学术型硕士', '专业型硕士'] as const).map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setDegreeType(dt)}
                    className={`px-2.5 py-2 text-xs font-medium whitespace-nowrap ${
                      degreeType === dt
                        ? 'bg-[#00407A] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {dt === 'ALL' ? '全部学位' : dt.replace('硕士', '')}
                  </button>
                ))}
              </div>

              <div className="sm:col-span-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setOnlyJoint((v) => !v)}
                  className={`w-full px-2.5 py-2 text-xs font-semibold whitespace-nowrap ${
                    onlyJoint
                      ? 'bg-[#006B77] text-white'
                      : 'border border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  仅看联培
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
              <span>
                共匹配 <strong className="font-mono text-[#00407A] tabular-nums">{directions.length}</strong>{' '}
                条招生方向（涵盖 {groupedByInstitute.length} 个培养单位/专项）
              </span>
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>重置条件</span>
              </button>
            </div>
          </div>

          {loading && directions.length === 0 ? (
            <div className="border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              正在从服务端匹配招生方向与初试科目...
            </div>
          ) : groupedByInstitute.length === 0 ? (
            <div className="border border-slate-200 bg-white p-12 text-center">
              <Layers className="mx-auto h-8 w-8 text-slate-400" />
              <h4 className="mt-2 text-base font-semibold text-slate-900">暂无同时满足当前科目组合的方向</h4>
              <p className="mt-1 text-xs text-slate-500">
                可切换“包含任一科目即可”或精简左侧勾选科目。
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-4 bg-[#00407A] px-4 py-2 text-xs font-semibold text-white"
              >
                恢复查看全量方向
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedByInstitute.map(([instName, group]) => (
                <div key={instName} className="border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{group.title}</h3>
                      {group.items[0]?.isJointProgram && (
                        <span className="bg-[#006B77] px-2 py-0.5 text-[11px] font-semibold text-white">
                          联培/专项
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {group.items.length} 个招生方向
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {group.items.map((dir) => {
                      const isLockedTarget = activeTargetDirectionId === dir.id;
                      const hasSub4 = dir.subjects.subject4Code && dir.subjects.subject4Code !== '无';
                      return (
                        <div
                          key={dir.id}
                          className={`p-4 transition-colors ${
                            isLockedTarget ? 'bg-[#F0F7FF]' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                <span className="font-mono font-bold text-[#00407A] tabular-nums">
                                  {dir.majorCode}
                                </span>
                                <span className="font-semibold text-slate-900">{dir.majorName}</span>
                                <span aria-hidden="true">·</span>
                                <span>{dir.degreeType}</span>
                                {dir.jointProgramTitle && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-[#006B77] font-medium">{dir.jointProgramTitle}</span>
                                  </>
                                )}
                              </div>
                              <div className="text-sm font-semibold text-slate-900">
                                研究方向：{dir.directionName}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onSelectAsTarget(dir)}
                              className={`metro-tile shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                                isLockedTarget
                                  ? 'bg-[#006B77] text-white'
                                  : 'border border-[#00407A] bg-white text-[#00407A] hover:bg-[#00407A] hover:text-white'
                              }`}
                            >
                              {isLockedTarget ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>已设为白皮书目标</span>
                                </>
                              ) : (
                                <>
                                  <Target className="h-3.5 w-3.5" />
                                  <span>设为个人备考目标</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* 四科初试组合矩阵 */}
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <div className="border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
                              <div className="text-[11px] text-slate-400">科目一</div>
                              <div className="truncate font-medium text-slate-800">{dir.subjects.politics}</div>
                            </div>
                            <div className="border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
                              <div className="text-[11px] text-slate-400">科目二</div>
                              <div className="truncate font-medium text-slate-800">{dir.subjects.english}</div>
                            </div>
                            <div className="border border-[#00407A]/30 bg-[#F0F5FA] px-2.5 py-1.5 text-xs">
                              <div className="text-[11px] text-[#00407A]">业务课一</div>
                              <div className="truncate font-semibold text-slate-900">
                                <span className="font-mono">{dir.subjects.subject3Code}</span>{' '}
                                {dir.subjects.subject3Name}
                              </div>
                            </div>
                            <div className="border border-[#006B77]/30 bg-[#F0F9FA] px-2.5 py-1.5 text-xs">
                              <div className="text-[11px] text-[#006B77]">业务课二</div>
                              <div className="truncate font-semibold text-slate-900">
                                {hasSub4 ? (
                                  <>
                                    <span className="font-mono">{dir.subjects.subject4Code}</span>{' '}
                                    {dir.subjects.subject4Name}
                                  </>
                                ) : (
                                  <span className="text-slate-500">-- (300分制统考)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
