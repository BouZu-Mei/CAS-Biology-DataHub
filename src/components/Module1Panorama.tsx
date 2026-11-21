/**
 * @file Module1Panorama.tsx
 * @description 模块一：院所全景档案与联培专项雷达
 * 首页仅保留 62 所院所基础档案与固定结构统计，不展示不固定招生名额与同卷平替；联培雷达独立于子页签并隐藏不固定名额。
 */

import React, { useMemo, useState } from 'react';
import {
  MapPin,
  GraduationCap,
  Search,
  ExternalLink,
  ArrowRight,
  Compass,
  Scale,
  BookOpen,
} from 'lucide-react';
import { CAS_INSTITUTES } from '../data/casInstitutes';
import { CAS_JOINT_PROGRAMS } from '../data/casJointPrograms';
import {
  CasInstitute,
  InstituteDifficultyTier,
  JointProgram,
  RegionZone,
} from '../types/cas';
import {
  filterInstitutes,
  filterJointPrograms,
  INSTITUTE_DIFFICULTY_META,
  INSTITUTE_DIFFICULTY_TIERS,
} from '../utils/casFilters';

interface Module1PanoramaProps {
  onJumpToInstituteDirections: (instituteId: string) => void;
  onJumpToRiskDashboard: (instituteKeyword: string) => void;
}

export const Module1Panorama: React.FC<Module1PanoramaProps> = ({
  onJumpToInstituteDirections,
  onJumpToRiskDashboard,
}) => {
  const [subTab, setSubTab] = useState<'institutes' | 'joint'>('institutes');

  // 院所档案筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionZone | 'ALL'>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<InstituteDifficultyTier | 'ALL'>('ALL');
  const [selectedInstitute, setSelectedInstitute] = useState<CasInstitute>(CAS_INSTITUTES[0]);

  // 联培雷达筛选状态
  const [partnerKeyword, setPartnerKeyword] = useState('');
  const [programCategory, setProgramCategory] = useState<string>('ALL');
  const [selectedJoint, setSelectedJoint] = useState<JointProgram | null>(CAS_JOINT_PROGRAMS[0]);

  const filteredInstitutes = useMemo(
    () => filterInstitutes(CAS_INSTITUTES, searchQuery, regionFilter, difficultyFilter),
    [searchQuery, regionFilter, difficultyFilter]
  );

  const activeInstitute = useMemo(
    () => filteredInstitutes.find((i) => i.id === selectedInstitute.id) ?? filteredInstitutes[0],
    [filteredInstitutes, selectedInstitute.id]
  );

  const filteredJoints = useMemo(
    () =>
      filterJointPrograms(CAS_JOINT_PROGRAMS, {
        partnerKeyword,
        category: programCategory,
      }),
    [partnerKeyword, programCategory]
  );

  const activeJoint = useMemo(
    () => filteredJoints.find((p) => p.id === selectedJoint?.id) ?? filteredJoints[0] ?? null,
    [filteredJoints, selectedJoint]
  );

  const regionCounts = useMemo(() => {
    const beijing = CAS_INSTITUTES.filter((i) => i.region === RegionZone.BEIJING).length;
    const shanghai = CAS_INSTITUTES.filter((i) => i.region === RegionZone.SHANGHAI).length;
    return { beijing, shanghai, other: CAS_INSTITUTES.length - beijing - shanghai };
  }, []);

  return (
    <section aria-label="模块一：院所全景档案与联培专项" className="space-y-5">
      {/* 顶部标题与分段切换栏 */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            院所全景档案
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            核查中科院 {CAS_INSTITUTES.length} 所生命科学培养单位的区域分布、报考难度五档定级、培养地点及优势学科。
          </p>
        </div>

        <div role="tablist" aria-label="模块一子视图切换" className="flex shrink-0 border border-slate-300 bg-white">
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'institutes'}
            onClick={() => setSubTab('institutes')}
            className={`px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              subTab === 'institutes'
                ? 'bg-[#00407A] text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            院所基础档案 ({CAS_INSTITUTES.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'joint'}
            onClick={() => setSubTab('joint')}
            className={`border-l border-slate-300 px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              subTab === 'joint'
                ? 'bg-[#006B77] text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            联培专项雷达 ({CAS_JOINT_PROGRAMS.length})
          </button>
        </div>
      </div>

      {/* =================================================================
          视图 A：院所基础档案（仅保留院所档案与固定建制统计）
         ================================================================= */}
      {subTab === 'institutes' && (
        <div className="space-y-4">
          {/* 固定院所建制结构概览（无不固定名额与同卷平替） */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="bg-[#00407A] p-4 text-white">
              <div className="text-xs text-sky-200">国科大生物及相关培养单位</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums">{CAS_INSTITUTES.length} 所</div>
              <div className="mt-1 truncate text-xs text-sky-100/80">涵盖生科、农林、生态与医药</div>
            </div>
            <div className="border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">京区所与校部直属院系</div>
              <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {regionCounts.beijing} 所
              </div>
              <div className="mt-1 truncate text-xs text-slate-600">研一均赴雁栖湖校区培养</div>
            </div>
            <div className="border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">沪区与南京本地培养单位</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#006B77] tabular-nums">
                {regionCounts.shanghai + 2} 所
              </div>
              <div className="mt-1 truncate text-xs text-slate-600">上海8所与南京2所均不赴京</div>
            </div>
            <div className="border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">京外其它片区研究所</div>
              <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {regionCounts.other - 2} 所
              </div>
              <div className="mt-1 truncate text-xs text-slate-600">覆盖广深、华东华中及西南西北</div>
            </div>
          </div>

          {/* 搜索与地区筛选条 */}
          <div className="border border-slate-200 bg-white p-4 space-y-3">
            <div className="relative max-w-2xl">
              <label htmlFor="inst-search" className="sr-only">
                搜索院所名称、城市或核心学科
              </label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="inst-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索院所名、城市、代码或优势学科（如：杭州医学 / 80112）..."
                className="w-full border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#00407A] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs font-medium text-slate-500">区域筛选：</span>
                {(['ALL', ...Object.values(RegionZone)] as const).map((reg) => (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => setRegionFilter(reg)}
                    className={`px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      regionFilter === reg
                        ? 'bg-[#00407A] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {reg === 'ALL' ? '全部地区' : reg}
                  </button>
                ))}
              </div>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                当前显示 {filteredInstitutes.length} / {CAS_INSTITUTES.length} 所
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
              <span className="mr-1 text-xs font-medium text-slate-500">报考难度：</span>
              <button
                type="button"
                onClick={() => setDifficultyFilter('ALL')}
                className={`px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  difficultyFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                全部五档
              </button>
              {INSTITUTE_DIFFICULTY_TIERS.map((tier) => {
                const meta = INSTITUTE_DIFFICULTY_META[tier];
                const isActive = difficultyFilter === tier;
                const tierCount = CAS_INSTITUTES.filter((i) => i.difficultyTier === tier).length;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setDifficultyFilter(tier)}
                    className={`px-2.5 py-1.5 font-mono text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      isActive
                        ? `${meta.badgeBg} ${meta.badgeText}`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tier} ({tierCount})
                  </button>
                );
              })}
            </div>
          </div>

          {filteredInstitutes.length === 0 ? (
            <div className="border border-slate-200 bg-white p-10 text-center">
              <p className="text-sm font-medium text-slate-700">未找到匹配当前筛选条件的研究所。</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setRegionFilter('ALL');
                  setDifficultyFilter('ALL');
                }}
                className="mt-3 bg-[#00407A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#002B54]"
              >
                重置筛选条件
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              {/* 左侧院所磁贴列表 */}
              <div className="lg:col-span-7 grid grid-cols-1 gap-3 sm:grid-cols-2 content-start max-h-[820px] overflow-y-auto pr-1">
                {filteredInstitutes.map((inst) => {
                  const isSelected = activeInstitute?.id === inst.id;
                  const tierMeta = INSTITUTE_DIFFICULTY_META[inst.difficultyTier];
                  return (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => setSelectedInstitute(inst)}
                      className={`metro-tile flex flex-col justify-between border p-4 text-left transition-colors ${
                        isSelected
                          ? 'border-[#00407A] bg-[#00407A] text-white'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-[#00407A]'
                      }`}
                    >
                      <div>
                        <div
                          className={`flex items-center justify-between gap-2 text-xs ${
                            isSelected ? 'text-sky-200' : 'text-slate-500'
                          }`}
                        >
                          <span className="font-mono tabular-nums">代码 {inst.code}</span>
                          <span
                            className={`px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-tight ${
                              isSelected
                                ? 'bg-white/15 text-white border border-white/30'
                                : `${tierMeta.badgeBg} ${tierMeta.badgeText}`
                            }`}
                          >
                            {inst.difficultyTier}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-baseline justify-between gap-2">
                          <h3 className="text-base font-bold leading-snug">{inst.shortName}</h3>
                          <span
                            className={`shrink-0 text-[11px] ${
                              isSelected ? 'text-sky-200' : 'text-slate-500'
                            }`}
                          >
                            {inst.city}
                          </span>
                        </div>
                        <p
                          className={`mt-1 truncate text-xs ${
                            isSelected ? 'text-sky-100' : 'text-slate-600'
                          }`}
                        >
                          {inst.coreDisciplines.join(' · ')}
                        </p>
                      </div>

                      <div
                        className={`mt-3 border-t pt-2.5 text-xs ${
                          isSelected ? 'border-white/20 text-sky-100' : 'border-slate-100 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{inst.centralizedCampus}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 右侧固定档案详情面板 */}
              {activeInstitute && (
                <aside className="lg:col-span-5">
                  <div className="sticky top-6 border border-slate-200 bg-white p-6">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono tabular-nums">单位代码 {activeInstitute.code}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#00407A]" />
                        {activeInstitute.city} · {activeInstitute.region}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <h3 className="text-xl font-bold text-slate-900">{activeInstitute.name}</h3>
                      <span
                        className={`shrink-0 px-2 py-0.5 font-mono text-xs font-bold ${
                          INSTITUTE_DIFFICULTY_META[activeInstitute.difficultyTier].badgeBg
                        } ${INSTITUTE_DIFFICULTY_META[activeInstitute.difficultyTier].badgeText}`}
                      >
                        {activeInstitute.difficultyTier}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      报考难度：{activeInstitute.difficultyTier}
                    </p>
                    <p className="mt-1.5 truncate text-sm text-slate-700" title={activeInstitute.overview}>
                      {activeInstitute.overview}
                    </p>

                    <div className="mt-4 border border-slate-200 bg-[#F4F6F9] p-4 space-y-2 text-xs">
                      <div className="flex items-center gap-2 font-bold text-[#00407A]">
                        <GraduationCap className="h-4 w-4" />
                        <span>培养地点信息</span>
                      </div>
                      <div className="font-semibold text-slate-900">
                        {activeInstitute.centralizedCampus}
                      </div>
                      <p className="text-slate-600">{activeInstitute.teachingNote}</p>
                    </div>

                    <div className="mt-4 space-y-2.5 text-sm">
                      <div>
                        <div className="text-xs font-semibold text-slate-500">核心优势学科</div>
                        <div className="mt-0.5 text-slate-900 font-medium">
                          {activeInstitute.coreDisciplines.join(' / ')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">初试招生要点</div>
                        <div className="mt-0.5 text-slate-800">{activeInstitute.recruitmentFeature}</div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2.5 border-t border-slate-200 pt-4">
                      <button
                        type="button"
                        onClick={() => onJumpToInstituteDirections(activeInstitute.id)}
                        className="metro-tile flex items-center gap-1.5 bg-[#00407A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#002B54] whitespace-nowrap shrink-0"
                      >
                        <span>查看招生方向与科目</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onJumpToRiskDashboard(activeInstitute.shortName)}
                        className="metro-tile border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:border-[#00407A] whitespace-nowrap shrink-0"
                      >
                        查看报录与分数线
                      </button>
                      <a
                        href={activeInstitute.admissionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#00407A] hover:underline whitespace-nowrap shrink-0"
                      >
                        <span>官网目录</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          )}
        </div>
      )}

      {/* =================================================================
          视图 B：联培专项雷达（独立子页签，隐藏不固定招生名额）
         ================================================================= */}
      {subTab === 'joint' && (
        <div className="space-y-4">
          <div className="border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-5">
                <label htmlFor="joint-partner-search" className="sr-only">
                  按联培合作单位、院所或考试科目检索
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="joint-partner-search"
                    type="text"
                    value={partnerKeyword}
                    onChange={(e) => setPartnerKeyword(e.target.value)}
                    placeholder="搜合作高校或院所（如：杭高院、华南理工、动物所）..."
                    className="w-full border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-[#006B77] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-7 flex flex-wrap items-center gap-1.5">
                {(['ALL', '国科大杭高院专项', '大湾区联培专项', '京外所高校联培', '产业专项班'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setProgramCategory(cat)}
                      className={`px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${
                        programCategory === cat
                          ? 'bg-[#006B77] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'ALL' ? '全部类别' : cat}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {filteredJoints.length === 0 ? (
            <div className="border border-slate-200 bg-white p-10 text-center">
              <p className="text-sm text-slate-700">当前筛选条件下暂无匹配的联培或专项计划。</p>
              <button
                type="button"
                onClick={() => {
                  setPartnerKeyword('');
                  setProgramCategory('ALL');
                }}
                className="mt-3 bg-[#006B77] px-4 py-2 text-xs font-semibold text-white"
              >
                清空联培筛选
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-3">
                {filteredJoints.map((prog) => {
                  const isActive = activeJoint?.id === prog.id;
                  return (
                    <button
                      key={prog.id}
                      type="button"
                      onClick={() => setSelectedJoint(prog)}
                      className={`metro-tile block w-full border p-4 text-left transition-colors ${
                        isActive
                          ? 'border-[#006B77] bg-[#F0F9FA]'
                          : 'border-slate-200 bg-white hover:border-[#006B77]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span>
                          {prog.programCategory} · 依托 {prog.hostInstituteName}
                        </span>
                        <span className="font-mono font-semibold text-[#006B77]">
                          {prog.samePaperComparison.sharedSubjects}
                        </span>
                      </div>

                      <h3 className="mt-1.5 text-base font-bold text-slate-900">{prog.title}</h3>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-700">
                        <span className="flex items-center gap-1">
                          <Compass className="h-3.5 w-3.5 text-[#00407A]" />
                          合作载体：<strong>{prog.partnerUnit}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                          {prog.majorInfo.split('/')[0].trim()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <aside className="lg:col-span-5">
                {activeJoint && (
                  <div className="sticky top-6 border border-slate-200 bg-white p-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#006B77]">
                      <Scale className="h-4 w-4" />
                      <span>联培专项路径 · 本部 vs 联培对比</span>
                    </div>

                    <h3 className="mt-2 text-lg font-bold text-slate-900">{activeJoint.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">招生专业：{activeJoint.majorInfo}</p>

                    <div className="mt-4 grid grid-cols-2 border border-slate-200">
                      <div className="border-r border-slate-200 bg-slate-50 p-3.5">
                        <div className="text-xs text-slate-500">研究所本部参考</div>
                        <div className="mt-1 text-sm font-bold text-slate-900">
                          {activeJoint.hostInstituteName}
                        </div>
                        <div className="mt-2.5 font-mono text-xl font-bold text-[#AD1E24] tabular-nums">
                          {activeJoint.samePaperComparison.hostPrelimLine} 分
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {activeJoint.samePaperComparison.hostHeat}
                        </div>
                      </div>

                      <div className="bg-[#006B77] p-3.5 text-white">
                        <div className="text-xs text-teal-100">联培协同通道</div>
                        <div className="mt-1 text-sm font-bold">{activeJoint.partnerUnit}</div>
                        <div className="mt-2.5 font-mono text-xl font-bold tabular-nums">
                          {activeJoint.samePaperComparison.jointPrelimLine} 分
                        </div>
                        <div className="mt-1 text-xs text-teal-50">
                          {activeJoint.samePaperComparison.jointHeat}
                        </div>
                      </div>
                    </div>

                    <dl className="mt-4 space-y-2 text-xs">
                      <div className="border-b border-slate-100 pb-2">
                        <dt className="font-semibold text-slate-500">共享考试科目</dt>
                        <dd className="mt-0.5 font-mono font-medium text-slate-900">
                          {activeJoint.samePaperComparison.sharedSubjects}
                        </dd>
                      </div>
                      <div className="border-b border-slate-100 pb-2">
                        <dt className="font-semibold text-slate-500">培养地点流转</dt>
                        <dd className="mt-0.5 text-slate-700">{activeJoint.trainingTrack}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[#00407A]">专项优势</dt>
                        <dd className="mt-0.5 text-slate-800">
                          {activeJoint.samePaperComparison.recommendationReason}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5 flex gap-2 border-t border-slate-200 pt-4">
                      <button
                        type="button"
                        onClick={() => onJumpToInstituteDirections(activeJoint.hostInstituteId)}
                        className="metro-tile flex items-center gap-1.5 bg-[#00407A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#002B54] whitespace-nowrap shrink-0"
                      >
                        <span>检索对应初试科目方向</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
