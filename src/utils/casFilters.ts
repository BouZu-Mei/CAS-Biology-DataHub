/**
 * @file casFilters.ts
 * @description 纯逻辑计算、全量 3,089 导师方向融合引擎与分页筛选模块（与 React UI 解耦，支持独立单元测试）
 * 涵盖：院所与联培雷达筛选、初试科目双向过滤、2024-2026 分数线四区间分级与缺失率校验、
 * 全量 3,089 导师方向语料 + 62 所 × 241 官方招生方向三级级联匹配（按相关度降序精选 10-20 个方向）及导师名录分页检索。
 */

import { CAS_ADVISORS } from '../data/casAdvisors';
import { CAS_INSTITUTES } from '../data/casInstitutes';
import { RESEARCH_EXPLORATION_TREE } from '../data/casResearchTree';
import { ADMISSION_DIRECTIONS } from '../data/casSubjectsAndAdmissions';
import {
  AIAdvisorMatchResponse,
  AIDirectionReport,
  AdmissionDirection,
  AdmissionRiskRecord,
  CasAdvisor,
  CasInstitute,
  InstituteDifficultyTier,
  JointProgram,
  RegionZone,
  ResearchQuizAnswers,
  ScoreEvaluationResult,
  ScoreSafetyMetrics,
  ScoreZone,
  SubSpecialtyNode,
} from '../types/cas';

export type { ScoreZone, ScoreSafetyMetrics, ScoreEvaluationResult };

export type SortDirection = 'asc' | 'desc' | 'none';

export const INSTITUTE_DIFFICULTY_TIERS: InstituteDifficultyTier[] = [
  'Extreme',
  'Ultra',
  'ProMax',
  'Pro',
  'Plus',
];

export const INSTITUTE_DIFFICULTY_META: Record<
  InstituteDifficultyTier,
  {
    tier: InstituteDifficultyTier;
    tagline: string;
    badgeBg: string;
    badgeText: string;
    rank: number;
  }
> = {
  Extreme: {
    tier: 'Extreme',
    tagline: '顶流旗舰所 · 高分热区竞争激烈',
    badgeBg: 'bg-[#AD1E24]',
    badgeText: 'text-white',
    rank: 5,
  },
  Ultra: {
    tier: 'Ultra',
    tagline: '一线强所档 · 京沪广杭高热报考',
    badgeBg: 'bg-[#B45309]',
    badgeText: 'text-white',
    rank: 4,
  },
  ProMax: {
    tier: 'ProMax',
    tagline: '特色骨干强所 · 分数线中高稳健',
    badgeBg: 'bg-[#00407A]',
    badgeText: 'text-white',
    rank: 3,
  },
  Pro: {
    tier: 'Pro',
    tagline: '区域骨干单位 · 统考标准明确',
    badgeBg: 'bg-[#006B77]',
    badgeText: 'text-white',
    rank: 2,
  },
  Plus: {
    tier: 'Plus',
    tagline: '京外特色研究单元 · 须扎实备考冲刺高分',
    badgeBg: 'bg-slate-600',
    badgeText: 'text-white',
    rank: 1,
  },
};

/** 各难度档位在公开线之上的高分优势区（区间 4）基准锚点（严格低于 400 分，确保 400 分已跨过最高门槛） */
export const TIER_Z4_ANCHOR: Record<InstituteDifficultyTier, number> = {
  Plus: 374,
  Pro: 380,
  ProMax: 386,
  Ultra: 392,
  Extreme: 398,
};

/**
 * 按“越低越疏松、越高越密集”原则计算公开线之上 4 个分段的起始分数：
 * - 公开线越低，总跨度与低分段步长越宽（300 分处于最低所区间 1 中游，且全库 300 分均无法进入区间 2 及以上）；
 * - 公开线/难度档越高，区间划分越密集，且全库最高所区间 4 起始线均严格不超过 399 分（400 分必跨入区间 4）；
 * - 同一公开线下，五档难度（Plus < Pro < ProMax < Ultra < Extreme）区间起始线严格递增。
 */
export function computeZoneBoundaries(
  prelimThreshold: number,
  zoneTier: InstituteDifficultyTier
): {
  z1Start: number;
  z2Start: number;
  z3Start: number;
  z4Start: number;
} {
  const rawZ4 = TIER_Z4_ANCHOR[zoneTier] + Math.round(Math.max(0, prelimThreshold - 260) * 0.04);
  const z4Start = Math.min(399, Math.max(prelimThreshold + 14, rawZ4));
  const span = z4Start - prelimThreshold;

  const tRatio = Math.min(1, Math.max(0, (prelimThreshold - 240) / 140));
  const f1 = 0.72 - 0.24 * tRatio;
  const rem = 1 - f1;
  const f2 = rem * 0.56;

  let w1 = Math.max(6, Math.round(span * f1));
  let w2 = Math.max(4, Math.round(span * f2));
  let w3 = Math.max(4, span - w1 - w2);
  if (w3 < 4) {
    w1 -= 4 - w3;
    w3 = 4;
  }

  const z1Start = prelimThreshold;
  const z2Start = z1Start + w1;
  const z3Start = z2Start + w2;
  return { z1Start, z2Start, z3Start, z4Start };
}

/**
 * 筛选院所全景目录（支持地区、报考难度五档及关键词检索）
 */
export function filterInstitutes(
  institutes: CasInstitute[],
  searchQuery: string,
  regionFilter: RegionZone | 'ALL',
  difficultyFilter: InstituteDifficultyTier | 'ALL' = 'ALL'
): CasInstitute[] {
  const q = searchQuery.trim().toLowerCase();
  return institutes.filter((inst) => {
    if (regionFilter !== 'ALL' && inst.region !== regionFilter) {
      return false;
    }
    if (difficultyFilter !== 'ALL' && inst.difficultyTier !== difficultyFilter) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      inst.name,
      inst.shortName,
      inst.city,
      inst.code,
      inst.difficultyTier,
      inst.centralizedCampus,
      ...inst.coreDisciplines,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

/**
 * 筛选联培项目与专项计划雷达（隐藏不固定招生名额）
 */
export function filterJointPrograms(
  programs: JointProgram[],
  options: {
    partnerKeyword?: string;
    category?: string;
  }
): JointProgram[] {
  const partnerQ = (options.partnerKeyword || '').trim().toLowerCase();

  return programs.filter((prog) => {
    if (options.category && options.category !== 'ALL' && prog.programCategory !== options.category) {
      return false;
    }
    if (!partnerQ) return true;
    const text = [
      prog.title,
      prog.partnerUnit,
      prog.hostInstituteName,
      prog.majorInfo,
      prog.samePaperComparison.sharedSubjects,
    ]
      .join(' ')
      .toLowerCase();
    return text.includes(partnerQ);
  });
}

/**
 * 双向检索方向过滤
 */
export function filterBidirectionalDirections(
  directions: AdmissionDirection[],
  options: {
    selectedSubjectCodes: string[];
    matchMode?: 'ANY' | 'ALL';
    instituteId?: string | 'ALL';
    searchQuery?: string;
    degreeType?: 'ALL' | '学术型硕士' | '专业型硕士';
    onlyJoint?: boolean;
  }
): AdmissionDirection[] {
  const {
    selectedSubjectCodes,
    matchMode = 'ALL',
    instituteId = 'ALL',
    searchQuery = '',
    degreeType = 'ALL',
    onlyJoint = false,
  } = options;
  const q = searchQuery.trim().toLowerCase();

  return directions.filter((dir) => {
    if (instituteId !== 'ALL' && dir.instituteId !== instituteId) {
      return false;
    }
    if (degreeType !== 'ALL' && dir.degreeType !== degreeType) {
      return false;
    }
    if (onlyJoint && !dir.isJointProgram) {
      return false;
    }

    if (selectedSubjectCodes.length > 0) {
      const dirCodes = [dir.subjects.subject3Code, dir.subjects.subject4Code].filter(
        (c) => c && c !== '无'
      );
      if (matchMode === 'ALL') {
        const allMatched = selectedSubjectCodes.every((code) => dirCodes.includes(code));
        if (!allMatched) return false;
      } else {
        const anyMatched = selectedSubjectCodes.some((code) => dirCodes.includes(code));
        if (!anyMatched) return false;
      }
    }

    if (!q) return true;
    const haystack = [
      dir.instituteName,
      dir.jointProgramTitle ?? '',
      dir.majorCode,
      dir.majorName,
      dir.directionName,
      dir.subjects.subject3Code,
      dir.subjects.subject3Name,
      dir.subjects.subject4Code,
      dir.subjects.subject4Name,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

/**
 * 计算分数线看板各项指标的“暂无数据”缺失率（用于自动剔除 >70% 暂无数据的无效字段）
 */
export function getRiskFieldMissingRates(records: AdmissionRiskRecord[]): Record<string, number> {
  const n = Math.max(1, records.length);
  const pct = (count: number) => Number(((count / n) * 100).toFixed(2));
  return {
    plannedQuota: pct(records.filter((r) => r.plannedQuota === null).length),
    unifiedRemainingQuota: pct(records.filter((r) => r.unifiedRemainingQuota === null).length),
    reexamCount: pct(records.filter((r) => r.reexamCount === null).length),
    admittedCount: pct(records.filter((r) => r.admittedCount === null).length),
    exemptRatioPct: pct(records.filter((r) => r.exemptRatioPct === null).length),
    applicationRatio: pct(records.filter((r) => r.applicationRatio === null).length),
    prelimThreshold: pct(records.filter((r) => r.prelimThreshold === null).length),
    singleLineNote: pct(
      records.filter((r) => !r.singleLineNote || r.singleLineNote.includes('暂无数据')).length
    ),
    admittedMin: pct(records.filter((r) => r.admittedMin === null).length),
    admittedMedian: pct(records.filter((r) => r.admittedMedian === null).length),
    admittedMax: pct(records.filter((r) => r.admittedMax === null).length),
  };
}

/**
 * 统考分数线数据排序与多维筛选（年份 / 区域 / 报考难度 / 输入分数所在区间 / 关键词；null 值恒排在已知数值之后）
 */
export function sortAndFilterRiskRecords(
  records: AdmissionRiskRecord[],
  options: {
    year?: number | 'ALL';
    searchQuery?: string;
    regionFilter?: RegionZone | 'ALL';
    difficultyFilter?: InstituteDifficultyTier | 'ALL';
    targetScore?: number | null;
    targetZone?: 'PASSED' | 'ALL' | 1 | 2 | 3 | 4;
    thresholdSort?: SortDirection;
    ratioSort?: SortDirection;
    onlyWithEmpiricalData?: boolean;
    institutes?: CasInstitute[];
  }
): AdmissionRiskRecord[] {
  const q = (options.searchQuery || '').trim().toLowerCase();
  const instMap = new Map((options.institutes ?? CAS_INSTITUTES).map((inst) => [inst.id, inst]));
  const regionFilter = options.regionFilter ?? 'ALL';
  const difficultyFilter = options.difficultyFilter ?? 'ALL';
  const targetScore =
    typeof options.targetScore === 'number' && Number.isFinite(options.targetScore)
      ? options.targetScore
      : null;
  const targetZone = options.targetZone ?? 'PASSED';

  const filtered = records.filter((rec) => {
    if (options.year && options.year !== 'ALL' && rec.year !== options.year) {
      return false;
    }
    const inst = instMap.get(rec.instituteId);
    if (regionFilter !== 'ALL' && inst?.region !== regionFilter) {
      return false;
    }
    if (difficultyFilter !== 'ALL' && inst?.difficultyTier !== difficultyFilter) {
      return false;
    }
    if (options.onlyWithEmpiricalData) {
      const hasEmpirical = rec.prelimThreshold !== null || rec.plannedQuota !== null;
      if (!hasEmpirical) return false;
    }
    if (targetScore !== null && targetZone !== 'ALL') {
      const metrics = calculateScoreSafetyMetrics(rec);
      const evalRes = evaluateScoreAgainstZones(targetScore, metrics);
      if (!evalRes) return false;
      if (targetZone === 'PASSED') {
        if (evalRes.status === 'below') return false;
      } else {
        if (evalRes.status !== `zone${targetZone}`) return false;
      }
    }
    if (!q) return true;
    const text = [
      rec.instituteName,
      inst?.shortName ?? '',
      inst?.name ?? '',
      inst?.code ?? '',
      inst?.city ?? '',
      rec.majorCode,
      rec.majorName,
      rec.directionLabel,
      rec.subjectCombo,
      rec.singleLineNote,
    ]
      .join(' ')
      .toLowerCase();
    return text.includes(q);
  });

  if (options.thresholdSort === 'asc' || options.thresholdSort === 'desc') {
    const dir = options.thresholdSort === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (a.prelimThreshold === null && b.prelimThreshold === null) {
        return (b.plannedQuota ?? 0) - (a.plannedQuota ?? 0);
      }
      if (a.prelimThreshold === null) return 1;
      if (b.prelimThreshold === null) return -1;
      if (a.prelimThreshold !== b.prelimThreshold) {
        return (a.prelimThreshold - b.prelimThreshold) * dir;
      }
      return (b.plannedQuota ?? 0) - (a.plannedQuota ?? 0);
    });
  }

  if (options.ratioSort === 'asc' || options.ratioSort === 'desc') {
    const dir = options.ratioSort === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (a.applicationRatio === null && b.applicationRatio === null) {
        return (b.prelimThreshold ?? 0) - (a.prelimThreshold ?? 0);
      }
      if (a.applicationRatio === null) return 1;
      if (b.applicationRatio === null) return -1;
      if (a.applicationRatio !== b.applicationRatio) {
        return (a.applicationRatio - b.applicationRatio) * dir;
      }
      return (b.prelimThreshold ?? 0) - (a.prelimThreshold ?? 0);
    });
  }
  return filtered;
}

const INSTITUTE_MAP = new Map(CAS_INSTITUTES.map((inst) => [inst.id, inst]));
const RANK_TO_DIFFICULTY_TIER: InstituteDifficultyTier[] = ['Plus', 'Pro', 'ProMax', 'Ultra', 'Extreme'];

/**
 * 计算单条招生数据的五档难度定级与公开线之上四区间划分参数
 */
export function calculateScoreSafetyMetrics(record: AdmissionRiskRecord): ScoreSafetyMetrics {
  const inst = INSTITUTE_MAP.get(record.instituteId);
  const hasScoreRange =
    record.admittedMin !== null &&
    record.admittedMedian !== null &&
    record.admittedMax !== null;

  const safeMarginOverThreshold =
    record.admittedMedian !== null && record.prelimThreshold !== null
      ? Math.max(0, record.admittedMedian - record.prelimThreshold)
      : null;

  let riskLevel: ScoreSafetyMetrics['riskLevel'] = '暂无数据';
  if (record.prelimThreshold !== null || record.applicationRatio !== null) {
    let scoreRank = 1;
    if (
      (record.prelimThreshold !== null && record.prelimThreshold >= 345) ||
      (record.applicationRatio !== null && record.applicationRatio >= 4.0)
    ) {
      scoreRank = 5;
    } else if (
      (record.prelimThreshold !== null && record.prelimThreshold >= 325) ||
      (record.applicationRatio !== null && record.applicationRatio >= 2.5)
    ) {
      scoreRank = 4;
    } else if (
      (record.prelimThreshold !== null && record.prelimThreshold >= 305) ||
      (record.applicationRatio !== null && record.applicationRatio >= 1.8)
    ) {
      scoreRank = 3;
    } else if (
      (record.prelimThreshold !== null && record.prelimThreshold >= 285) ||
      (record.applicationRatio !== null && record.applicationRatio >= 1.3)
    ) {
      scoreRank = 2;
    }

    const instRank = inst ? INSTITUTE_DIFFICULTY_META[inst.difficultyTier].rank : 1;
    const isCoreRegion =
      inst &&
      (inst.region === RegionZone.BEIJING ||
        inst.region === RegionZone.SHANGHAI ||
        inst.id.startsWith('ucas-'));
    const floorRank = Math.max(isCoreRegion ? 3 : 1, instRank - 1);
    const finalRank = Math.min(5, Math.max(scoreRank, floorRank));
    riskLevel = RANK_TO_DIFFICULTY_TIER[finalRank - 1];
  }

  const zoneTier: InstituteDifficultyTier =
    inst?.difficultyTier ?? (riskLevel !== '暂无数据' ? riskLevel : 'ProMax');

  const t = record.prelimThreshold;
  const bounds = t !== null ? computeZoneBoundaries(t, zoneTier) : null;

  const scoreZones: ScoreZone[] =
    bounds !== null
      ? [
          {
            zoneIndex: 1,
            label: '危险擦线区',
            startScore: bounds.z1Start,
            endScore: bounds.z2Start,
            isDanger: true,
            barClass: 'bg-[#AD1E24]/30 border-r border-[#AD1E24]/60',
            textClass: 'text-[#AD1E24]',
            description: '刚过公开线仍属高淘汰危险区，切勿低估复试淘汰压力',
          },
          {
            zoneIndex: 2,
            label: '边缘博弈区',
            startScore: bounds.z2Start,
            endScore: bounds.z3Start,
            isDanger: false,
            barClass: 'bg-amber-500/25 border-r border-amber-600/50',
            textClass: 'text-[#B45309]',
            description: '高于公开线但处于复试边缘竞争带，复试容错空间有限',
          },
          {
            zoneIndex: 3,
            label: '稳妥竞争区',
            startScore: bounds.z3Start,
            endScore: bounds.z4Start,
            isDanger: false,
            barClass: 'bg-[#00407A]/20 border-r border-[#00407A]/40',
            textClass: 'text-[#00407A]',
            description: '具备较扎实的初试余量，仍需认真备战复试专业环节',
          },
          {
            zoneIndex: 4,
            label: '高分优势区',
            startScore: bounds.z4Start,
            endScore: null,
            isDanger: false,
            barClass: 'bg-[#006B77]/30',
            textClass: 'text-[#006B77]',
            description: '初试分差优势显著，位列高分竞争梯队',
          },
        ]
      : [];

  const recommendedSafeTarget =
    record.admittedMedian !== null && record.admittedMin !== null
      ? Math.max(record.admittedMedian, bounds ? bounds.z3Start : record.admittedMin + 20)
      : bounds
      ? bounds.z3Start
      : null;

  const numericScores = [
    record.prelimThreshold,
    record.admittedMin,
    record.admittedMedian,
    record.admittedMax,
    scoreZones[3]?.startScore ?? null,
  ].filter((v): v is number => v !== null);

  const rawMin = numericScores.length > 0 ? Math.min(...numericScores) - 20 : 250;
  const rawMax = numericScores.length > 0 ? Math.max(...numericScores) + 25 : 440;
  const axisMin = Math.max(240, Math.floor(rawMin / 10) * 10);
  const axisMax = Math.min(460, Math.ceil(rawMax / 10) * 10);

  return {
    prelimThreshold: record.prelimThreshold,
    admittedMin: record.admittedMin,
    admittedMedian: record.admittedMedian,
    admittedMax: record.admittedMax,
    safeMarginOverThreshold,
    recommendedSafeTarget,
    hasScoreRange,
    riskLevel,
    zoneTier,
    scoreZones,
    axisMin,
    axisMax,
  };
}

/**
 * 评估考生手动填写的初试估分所处区间（包含低于公开线与公开线之上 4 个区间）
 */
export function evaluateScoreAgainstZones(
  score: number,
  metrics: ScoreSafetyMetrics
): ScoreEvaluationResult | null {
  if (metrics.prelimThreshold === null || metrics.scoreZones.length !== 4) {
    return null;
  }
  const t = metrics.prelimThreshold;
  if (score < t) {
    return {
      status: 'below',
      label: '未达公开线',
      detail: `低于公开线 ${t - score} 分`,
      textClass: 'text-[#AD1E24]',
    };
  }
  const [z1, z2, z3, z4] = metrics.scoreZones;
  if (score < z2.startScore) {
    return {
      status: 'zone1',
      label: z1.label,
      detail: `仅超公开线 +${score - t} 分（危险擦线区：${z1.startScore}–${z2.startScore - 1} 分）`,
      textClass: z1.textClass,
    };
  }
  if (score < z3.startScore) {
    return {
      status: 'zone2',
      label: z2.label,
      detail: `超公开线 +${score - t} 分（边缘博弈区：${z2.startScore}–${z3.startScore - 1} 分）`,
      textClass: z2.textClass,
    };
  }
  if (score < z4.startScore) {
    return {
      status: 'zone3',
      label: z3.label,
      detail: `超公开线 +${score - t} 分（稳妥竞争区：${z3.startScore}–${z4.startScore - 1} 分）`,
      textClass: z3.textClass,
    };
  }
  return {
    status: 'zone4',
    label: z4.label,
    detail: `超公开线 +${score - t} 分（高分优势区：≥${z4.startScore} 分）`,
    textClass: z4.textClass,
  };
}

/**
 * 本地语义关键词预匹配导师名录（仅用于用户主动查阅名录时检索）
 */
export function preRankAdvisorsByKeyword(advisors: CasAdvisor[], keywordQuery: string): CasAdvisor[] {
  const q = keywordQuery.trim().toLowerCase();
  if (!q) return advisors;

  const tokens = q.split(/[\s,，、/+]+/).filter(Boolean);

  const scored = advisors.map((adv) => {
    const fullText = [
      adv.name,
      adv.instituteName,
      adv.department,
      adv.researchSummary,
      ...adv.keywords,
      ...adv.recruitingMajors,
      ...adv.recentPapersContext,
    ]
      .join(' ')
      .toLowerCase();

    let score = 0;
    if (fullText.includes(q)) score += 10;
    for (const token of tokens) {
      if (adv.keywords.some((k) => k.toLowerCase().includes(token))) score += 5;
      if (adv.researchSummary.toLowerCase().includes(token)) score += 3;
      if (adv.instituteName.toLowerCase().includes(token) || adv.name.toLowerCase().includes(token)) {
        score += 4;
      }
      if (adv.recruitingMajors.some((m) => m.toLowerCase().includes(token))) score += 2;
      if (adv.recentPapersContext.some((p) => p.toLowerCase().includes(token))) score += 2;
    }
    return { adv, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.adv);
}

/**
 * 按研究所分页检索 62 所全量生物导师名录（纯客观目录查询，不做推荐排序）
 */
export function filterAndPaginateAdvisors(
  advisors: CasAdvisor[],
  options: {
    instituteId: string;
    searchQuery?: string;
    degreeLevel?: 'ALL' | '硕士' | '博士';
    page?: number;
    pageSize?: number;
  }
): {
  items: CasAdvisor[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
} {
  const { instituteId, searchQuery = '', degreeLevel = 'ALL', page = 1, pageSize = 20 } = options;
  const q = searchQuery.trim().toLowerCase();

  const byInst =
    instituteId === 'ALL' ? advisors : advisors.filter((a) => a.instituteId === instituteId);

  const byDegree =
    degreeLevel === 'ALL'
      ? byInst
      : byInst.filter((a) => !a.degreeLevels || a.degreeLevels.includes(degreeLevel));

  const filtered = q
    ? byDegree.filter((adv) => {
        const text = [
          adv.name,
          adv.instituteName,
          adv.department,
          adv.researchSummary,
          ...adv.keywords,
          ...adv.recruitingMajors,
        ]
          .join(' ')
          .toLowerCase();
        return text.includes(q);
      })
    : byDegree;

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    totalCount,
    totalPages,
    currentPage,
  };
}

// =========================================================================
// 全量 3,089 位生物导师方向语料程序化解析引擎（零个人姓名泄露，全量并入三级探索）
// =========================================================================

const PLAN_NOISE_REGEX = /少干|少数民族|高层次骨干|骨干计划|普通计划|专项报考|硕转博|工程博士/;

function cleanAdvisorTopics(rawKeywords: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of rawKeywords) {
    if (PLAN_NOISE_REGEX.test(raw)) continue;
    const parts = raw.split(/[、，,;；/]+/);
    for (const part of parts) {
      const cleaned = part
        .replace(/^（[^）]+）/, '')
        .replace(/（[^）]*）$/, '')
        .trim();
      if (cleaned.length < 2 || PLAN_NOISE_REGEX.test(cleaned)) continue;
      if (!seen.has(cleaned)) {
        seen.add(cleaned);
        out.push(cleaned);
      }
    }
  }
  return out;
}

interface AdvisorDirectionRecord {
  instituteId: string;
  majorCodes: string[];
  topics: string[];
  department: string;
  searchableText: string;
}

const ALL_ADVISOR_DIRECTION_RECORDS: AdvisorDirectionRecord[] = [];
const ADVISOR_BY_INSTITUTE_MAJOR = new Map<string, AdvisorDirectionRecord[]>();
const ADVISOR_BY_INSTITUTE = new Map<string, AdvisorDirectionRecord[]>();
const UNIQUE_CORPUS_TOPICS = new Set<string>();

(() => {
  for (const adv of CAS_ADVISORS) {
    const topics = cleanAdvisorTopics(adv.keywords);
    for (const t of topics) UNIQUE_CORPUS_TOPICS.add(t);

    const majorCodes = adv.recruitingMajors
      .map((m) => m.trim().split(/\s+/)[0])
      .filter((c) => /^\d{4,6}[A-Z0-9]*$/.test(c));

    // 移除所有姓名，仅保留客观学科方向语料
    const summaryClean = adv.researchSummary.replace(new RegExp(adv.name, 'g'), '').trim();
    const searchableText = [
      ...topics,
      adv.department,
      summaryClean,
      ...adv.recruitingMajors,
    ]
      .join(' ')
      .toLowerCase();

    const rec: AdvisorDirectionRecord = {
      instituteId: adv.instituteId,
      majorCodes,
      topics,
      department: adv.department,
      searchableText,
    };

    ALL_ADVISOR_DIRECTION_RECORDS.push(rec);

    let instList = ADVISOR_BY_INSTITUTE.get(adv.instituteId);
    if (!instList) {
      instList = [];
      ADVISOR_BY_INSTITUTE.set(adv.instituteId, instList);
    }
    instList.push(rec);

    for (const code of majorCodes) {
      const key = `${adv.instituteId}::${code}`;
      let pairList = ADVISOR_BY_INSTITUTE_MAJOR.get(key);
      if (!pairList) {
        pairList = [];
        ADVISOR_BY_INSTITUTE_MAJOR.set(key, pairList);
      }
      pairList.push(rec);
    }
  }
})();

export function getAdvisorCorpusStats(): {
  totalAdvisorsAnalyzed: number;
  uniqueTopicsCount: number;
  institutesCovered: number;
} {
  return {
    totalAdvisorsAnalyzed: ALL_ADVISOR_DIRECTION_RECORDS.length,
    uniqueTopicsCount: UNIQUE_CORPUS_TOPICS.size,
    institutesCovered: ADVISOR_BY_INSTITUTE.size,
  };
}

/**
 * 统计指定细分方向（L3）在全量 3,089 导师库中的相近研究方向频次（零人名）
 */
export function countCorpusMatchesForNode(
  subSpecialty: SubSpecialtyNode
): { matchingAdvisorCount: number; topTopics: string[] } {
  const kwList = Array.from(
    new Set([
      ...(subSpecialty.matchRules.keywords ?? []),
      ...(subSpecialty.keyMethods ?? []),
    ])
  )
    .map((k) => k.toLowerCase())
    .filter((k) => k.length >= 2);

  const majorCodes = new Set(subSpecialty.matchRules.majorCodes ?? []);
  const prefixes = subSpecialty.matchRules.majorPrefixes ?? [];

  let count = 0;
  const topicFreq = new Map<string, number>();

  for (const rec of ALL_ADVISOR_DIRECTION_RECORDS) {
    const majorHit =
      rec.majorCodes.some((c) => majorCodes.has(c)) ||
      rec.majorCodes.some((c) => prefixes.some((p) => c.startsWith(p)));
    const kwHit = kwList.some((kw) => rec.searchableText.includes(kw));

    if (majorHit || kwHit) {
      count += 1;
      for (const t of rec.topics) {
        topicFreq.set(t, (topicFreq.get(t) ?? 0) + 1);
      }
    }
  }

  const topTopics = Array.from(topicFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([t]) => t);

  return { matchingAdvisorCount: count, topTopics };
}

function formatSubjectCombo(dir: AdmissionDirection): string {
  const has4 = dir.subjects.subject4Code && dir.subjects.subject4Code !== '无';
  return has4
    ? `${dir.subjects.subject3Code} ${dir.subjects.subject3Name} + ${dir.subjects.subject4Code} ${dir.subjects.subject4Name}`
    : `${dir.subjects.subject3Code} ${dir.subjects.subject3Name}`;
}

export interface ResolvedDirectionMatch {
  direction: AdmissionDirection;
  score: number;
  matchedAdvisorDirections: number;
  advisorDirectionTopics: string[];
}

interface PrecomputedDirectionCorpus {
  relevantCorpus: AdvisorDirectionRecord[];
  topicFreq: Map<string, number>;
  dirSearchable: string;
}

const DIRECTION_CORPUS_CACHE = new Map<string, PrecomputedDirectionCorpus>();

function getPrecomputedDirectionCorpus(dir: AdmissionDirection): PrecomputedDirectionCorpus {
  const cached = DIRECTION_CORPUS_CACHE.get(dir.id);
  if (cached) return cached;

  const inst = INSTITUTE_MAP.get(dir.instituteId);
  const pairKey = `${dir.instituteId}::${dir.majorCode}`;
  const pairAdvisors = ADVISOR_BY_INSTITUTE_MAJOR.get(pairKey) ?? [];
  const instAdvisors = ADVISOR_BY_INSTITUTE.get(dir.instituteId) ?? [];
  const relevantCorpus = pairAdvisors.length > 0 ? pairAdvisors : instAdvisors;

  const topicFreq = new Map<string, number>();
  const corpusTextChunks: string[] = [];
  for (const advRec of relevantCorpus) {
    corpusTextChunks.push(advRec.searchableText);
    for (const t of advRec.topics) {
      topicFreq.set(t, (topicFreq.get(t) ?? 0) + 1);
    }
  }

  const dirSearchable = [
    dir.instituteName,
    inst?.shortName ?? '',
    inst?.city ?? '',
    dir.majorCode,
    dir.majorName,
    dir.directionName,
    ...(inst?.coreDisciplines ?? []),
    ...corpusTextChunks.slice(0, 60),
  ]
    .join(' ')
    .toLowerCase();

  const entry: PrecomputedDirectionCorpus = {
    relevantCorpus,
    topicFreq,
    dirSearchable,
  };
  DIRECTION_CORPUS_CACHE.set(dir.id, entry);
  return entry;
}

/**
 * 将三级树第 3 级细分小方向 + 全量 3,089 导师方向语料
 * 动态映射至全部 62 所 × 241 条官方招生方向，严格按相关度降序排序
 */
export function resolveSubSpecialtyDirections(
  subSpecialty: SubSpecialtyNode,
  allDirections: AdmissionDirection[] = ADMISSION_DIRECTIONS,
  extraNotes = ''
): ResolvedDirectionMatch[] {
  const rules = subSpecialty.matchRules;
  const noteTokens = extraNotes
    .trim()
    .toLowerCase()
    .split(/[\s,，、/+]+/)
    .filter(Boolean);

  const methodKeywords = (subSpecialty.keyMethods ?? []).filter((k) => k.length >= 2);
  const allTopicKws = Array.from(new Set([...(rules.keywords ?? []), ...methodKeywords]));

  const primaryResults: ResolvedDirectionMatch[] = [];
  const secondaryResults: ResolvedDirectionMatch[] = [];

  const fallbackPool: ResolvedDirectionMatch[] = [];

  for (const dir of allDirections) {
    const { relevantCorpus, topicFreq, dirSearchable } = getPrecomputedDirectionCorpus(dir);

    let score = 0;

    if (rules.majorCodes?.includes(dir.majorCode)) {
      score += 20;
    }
    if (rules.majorPrefixes?.some((prefix) => dir.majorCode.startsWith(prefix))) {
      score += 18;
    }
    if (rules.instituteIds?.includes(dir.instituteId)) {
      score += 10;
    }

    let l3Hits = 0;
    if (rules.keywords) {
      for (const kw of rules.keywords) {
        if (dirSearchable.includes(kw.toLowerCase())) {
          l3Hits += 1;
        }
      }
    }
    score += l3Hits * 4;

    let corpusHits = 0;
    const matchedTopicFreq = new Map<string, number>();

    for (const advRec of relevantCorpus) {
      const hitCount = allTopicKws.reduce(
        (acc, kw) => (advRec.searchableText.includes(kw.toLowerCase()) ? acc + 1 : acc),
        0
      );
      if (hitCount > 0) {
        corpusHits += 1;
        for (const t of advRec.topics) {
          const isDirectlyRelated = allTopicKws.some((kw) =>
            t.toLowerCase().includes(kw.toLowerCase())
          );
          matchedTopicFreq.set(t, (matchedTopicFreq.get(t) ?? 0) + (isDirectlyRelated ? 4 : 1));
        }
      }
    }

    for (const kw of methodKeywords) {
      if (dirSearchable.includes(kw.toLowerCase())) {
        score += 3;
      }
    }
    score += Math.min(18, corpusHits * 2);

    for (const tk of noteTokens) {
      if (dirSearchable.includes(tk)) {
        score += 12;
      }
    }

    const chosenTopicSource = matchedTopicFreq.size > 0 ? matchedTopicFreq : topicFreq;
    const topTopics = Array.from(chosenTopicSource.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([t]) => t);

    const entry: ResolvedDirectionMatch = {
      direction: dir,
      score,
      matchedAdvisorDirections: corpusHits > 0 ? corpusHits : relevantCorpus.length,
      advisorDirectionTopics: topTopics,
    };

    if (score >= 16) {
      primaryResults.push(entry);
    } else if (score > 0) {
      secondaryResults.push(entry);
    } else {
      fallbackPool.push(entry);
    }
  }

  const byRelevance = (a: ResolvedDirectionMatch, b: ResolvedDirectionMatch) =>
    b.score - a.score || b.matchedAdvisorDirections - a.matchedAdvisorDirections;

  primaryResults.sort(byRelevance);
  if (primaryResults.length >= 10) {
    return primaryResults;
  }

  secondaryResults.sort(byRelevance);
  const combined = [...primaryResults, ...secondaryResults];
  if (combined.length >= 12) {
    return combined.slice(0, 12);
  }

  fallbackPool.sort(byRelevance);
  return [...combined, ...fallbackPool.slice(0, 12 - combined.length)];
}

/**
 * 三级级联理想方向本地规则引擎：
 * 融合全部 3,089 导师方向语料 + 62 所 × 241 条官方招生方向，
 * 按相关度从高到低排序，仅精选展示 TOP 10-20 个官方招生方向。
 */
export function generateLocalDirectionReport(answers: ResearchQuizAnswers): AIDirectionReport {
  const domain =
    RESEARCH_EXPLORATION_TREE.find((d) => d.id === answers.level1DomainId) ??
    RESEARCH_EXPLORATION_TREE[0];
  const direction =
    domain.directions.find((d) => d.id === answers.level2DirectionId) ?? domain.directions[0];
  const subSpecialty =
    direction.subSpecialties.find((s) => s.id === answers.level3SubSpecialtyId) ??
    direction.subSpecialties[0];

  const matched = resolveSubSpecialtyDirections(
    subSpecialty,
    ADMISSION_DIRECTIONS,
    answers.extraNotes
  );

  // 严格限定只展示相关度从高到低排序的精选 10-20 个方向（默认取前 16 项，全库不足 16 时至少保留 10 项）
  const curated = matched.slice(0, 16);

  const recommendedTeams = curated.map(
    ({ direction: dir, matchedAdvisorDirections, advisorDirectionTopics }) => {
      const inst = INSTITUTE_MAP.get(dir.instituteId);
      const focusLine = inst?.coreDisciplines.slice(0, 3).join('、') || dir.majorName;
      return {
        instituteId: dir.instituteId,
        instituteName: dir.instituteName,
        majorCode: dir.majorCode,
        majorName: dir.majorName,
        directionName: dir.directionName,
        degreeType: dir.degreeType,
        suggestedSubjects: formatSubjectCombo(dir),
        matchReason: `契合「${subSpecialty.name}」· 学科底盘：${focusLine}`,
        advisorFocusNote:
          advisorDirectionTopics.length > 0
            ? `纳入 ${matchedAdvisorDirections} 项导师方向语料：${advisorDirectionTopics.join(' / ')}`
            : undefined,
        matchedAdvisorDirections,
        advisorDirectionTopics,
      };
    }
  );

  const uniqueInstCount = new Set(recommendedTeams.map((t) => t.instituteId)).size;
  const stats = getAdvisorCorpusStats();

  return {
    engineUsed: 'local-academic-graph',
    providerLabel: `全量图谱引擎（${stats.totalAdvisorsAnalyzed}导师方向 × ${ADMISSION_DIRECTIONS.length}招生方向）`,
    headline: `${domain.name} → ${direction.name} → ${subSpecialty.name}`,
    profileSummary: `已联合解析 ${stats.totalAdvisorsAnalyzed} 位导师研究方向语料与 62 所 ${ADMISSION_DIRECTIONS.length} 条招生目录，按相关度从高到低精选出 ${uniqueInstCount} 所共 ${recommendedTeams.length} 个高匹配招生方向（总候选 ${matched.length} 个）。`,
    recommendedTeams,
    preparationAdvice: [
      `初试科目优先对齐高相关方向的业务课组合（如 ${recommendedTeams[0]?.suggestedSubjects || '612+852 或 338+888'}），并在模块二核查全卷组合。`,
      `建议围绕「${subSpecialty.keyMethods.slice(0, 3).join('、') || subSpecialty.name}」先修教材与综述，再赴模块五导出备考白皮书。`,
      `锁定报考院所与专业代码后，可到工作区三「62所导师名录」按研究所分页自主查阅官网导师主页。`,
    ],
  };
}

/**
 * 探索解锁后：关键词跨全量 3,089 导师方向语料 × 62 所 × 241 条官方招生方向检索（按相关度排序精选前 20 条）
 */
export function matchTeamsLocally(keyword: string): AIAdvisorMatchResponse {
  const q = keyword.trim().toLowerCase();
  const tokens = q.split(/[\s,，、/+]+/).filter(Boolean);

  if (!q) {
    return {
      engineUsed: 'local-academic-graph',
      queryInterpretation: '请输入研究兴趣关键词、专业代码或学科词检索全库方向。',
      matches: [],
    };
  }

  interface ScoredDirection {
    dir: AdmissionDirection;
    score: number;
    matchedAdvisorDirections: number;
    advisorDirectionTopics: string[];
  }

  const scored: ScoredDirection[] = [];

  for (const dir of ADMISSION_DIRECTIONS) {
    const inst = INSTITUTE_MAP.get(dir.instituteId);
    const pairKey = `${dir.instituteId}::${dir.majorCode}`;
    const pairAdvisors = ADVISOR_BY_INSTITUTE_MAJOR.get(pairKey) ?? [];
    const instAdvisors = ADVISOR_BY_INSTITUTE.get(dir.instituteId) ?? [];
    const corpus = pairAdvisors.length > 0 ? pairAdvisors : instAdvisors;

    const dirText = [dir.majorCode, dir.majorName, dir.directionName].join(' ').toLowerCase();
    const instText = [dir.instituteName, inst?.shortName ?? '', inst?.city ?? '', ...(inst?.coreDisciplines ?? [])]
      .join(' ')
      .toLowerCase();

    let score = 0;
    if (dirText.includes(q)) score += 16;
    if (instText.includes(q)) score += 10;

    let corpusHits = 0;
    const matchedTopicFreq = new Map<string, number>();

    for (const advRec of corpus) {
      const hit =
        advRec.searchableText.includes(q) ||
        tokens.some((tk) => advRec.searchableText.includes(tk));
      if (hit) {
        corpusHits += 1;
        for (const t of advRec.topics) {
          const direct = t.toLowerCase().includes(q) || tokens.some((tk) => t.toLowerCase().includes(tk));
          matchedTopicFreq.set(t, (matchedTopicFreq.get(t) ?? 0) + (direct ? 5 : 1));
        }
      }
    }

    if (corpusHits > 0) {
      score += Math.min(20, 6 + corpusHits * 2);
    }

    for (const tk of tokens) {
      if (dir.majorCode.toLowerCase() === tk || dir.majorName.toLowerCase().includes(tk)) {
        score += 8;
      }
      if (dir.directionName.toLowerCase().includes(tk)) {
        score += 9;
      }
      if (inst?.coreDisciplines.some((d) => d.toLowerCase().includes(tk))) {
        score += 6;
      }
      if (dir.instituteName.toLowerCase().includes(tk) || inst?.city.toLowerCase().includes(tk)) {
        score += 5;
      }
    }

    if (score > 0) {
      const topTopics = Array.from(matchedTopicFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([t]) => t);

      scored.push({
        dir,
        score,
        matchedAdvisorDirections: corpusHits > 0 ? corpusHits : corpus.length,
        advisorDirectionTopics: topTopics,
      });
    }
  }

  const ranked = scored
    .sort((a, b) => b.score - a.score || b.matchedAdvisorDirections - a.matchedAdvisorDirections)
    .slice(0, 20);
  const uniqueInsts = new Set(ranked.map((r) => r.dir.instituteId)).size;

  return {
    engineUsed: 'local-academic-graph',
    queryInterpretation:
      ranked.length > 0
        ? `已联动 ${CAS_ADVISORS.length} 位导师方向语料与 62 所 ${ADMISSION_DIRECTIONS.length} 条招生方向，围绕「${keyword}」按相关度精选出 ${uniqueInsts} 所院系所共 ${ranked.length} 个匹配方向。`
        : `在全库 62 所招生方向及 ${CAS_ADVISORS.length} 位导师方向语料中暂未命中「${keyword}」，请尝试精简关键词。`,
    matches: ranked.map((item, idx) => {
      const inst = INSTITUTE_MAP.get(item.dir.instituteId);
      const discText = inst?.coreDisciplines.slice(0, 3).join('、') || item.dir.majorName;
      const topicLine =
        item.advisorDirectionTopics.length > 0
          ? ` · 导师库方向词(${item.matchedAdvisorDirections})：${item.advisorDirectionTopics.join(' / ')}`
          : '';
      return {
        instituteId: item.dir.instituteId,
        instituteName: item.dir.instituteName,
        majorCode: item.dir.majorCode,
        majorName: item.dir.majorName,
        directionName: item.dir.directionName,
        degreeType: item.dir.degreeType,
        fitLevel: idx < 3 ? '高度契合' : idx < 10 ? '重点推荐' : '交叉拓展',
        matchReason: `${item.dir.degreeType} · ${discText}${topicLine}`,
        examSubjects: formatSubjectCombo(item.dir),
        matchedAdvisorDirections: item.matchedAdvisorDirections,
        advisorDirectionTopics: item.advisorDirectionTopics,
      };
    }),
  };
}
