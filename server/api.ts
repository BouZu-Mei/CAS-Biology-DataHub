/**
 * @file server/api.ts
 * @description 服务端数据与核心算法 API 路由（全部 62 所院所、241 方向、714 条分数线、3,089 导师库及四区间/三级图谱算法均仅驻留于服务端）
 */

import express, { NextFunction, Request, Response, Router } from 'express';
import { CAS_ADVISORS } from '../src/data/casAdvisors';
import { CAS_INSTITUTES } from '../src/data/casInstitutes';
import { CAS_JOINT_PROGRAMS } from '../src/data/casJointPrograms';
import { RESEARCH_EXPLORATION_TREE } from '../src/data/casResearchTree';
import { SUBJECT_PREP_RESOURCES } from '../src/data/casResources';
import {
  ADMISSION_DIRECTIONS,
  ADMISSION_RISK_RECORDS,
  EXAM_SUBJECTS,
} from '../src/data/casSubjectsAndAdmissions';
import {
  AIAdvisorDeepProfile,
  DirectionOptionSummary,
  InstituteDifficultyTier,
  PublicBiologyDomainNode,
  RegionZone,
  ResearchQuizAnswers,
  SubSpecialtyNode,
} from '../src/types/cas';
import {
  calculateScoreSafetyMetrics,
  countCorpusMatchesForNode,
  evaluateScoreAgainstZones,
  filterAndPaginateAdvisors,
  filterBidirectionalDirections,
  filterInstitutes,
  filterJointPrograms,
  generateLocalDirectionReport,
  getAdvisorCorpusStats,
  INSTITUTE_DIFFICULTY_TIERS,
  matchTeamsLocally,
  sortAndFilterRiskRecords,
  SortDirection,
} from '../src/utils/casFilters';

const INSTITUTE_MAP = new Map(CAS_INSTITUTES.map((i) => [i.id, i]));
const DIRECTION_MAP = new Map(ADMISSION_DIRECTIONS.map((d) => [d.id, d]));
const ADVISOR_MAP = new Map(CAS_ADVISORS.map((a) => [a.id, a]));
const RESOURCE_MAP = new Map(SUBJECT_PREP_RESOURCES.map((r) => [r.subjectCode, r]));

const SUB_SPECIALTY_MAP = new Map<string, SubSpecialtyNode>();
for (const dom of RESEARCH_EXPLORATION_TREE) {
  for (const dir of dom.directions) {
    for (const sub of dir.subSpecialties) {
      SUB_SPECIALTY_MAP.set(sub.id, sub);
    }
  }
}

const PUBLIC_RESEARCH_TREE: PublicBiologyDomainNode[] = RESEARCH_EXPLORATION_TREE.map((dom) => ({
  id: dom.id,
  name: dom.name,
  badge: dom.badge,
  subtitle: dom.subtitle,
  directions: dom.directions.map((dir) => ({
    id: dir.id,
    name: dir.name,
    summary: dir.summary,
    subSpecialties: dir.subSpecialties.map((sub) => ({
      id: sub.id,
      name: sub.name,
      summary: sub.summary,
      keyMethods: sub.keyMethods,
    })),
  })),
}));

const DIRECTION_OPTIONS: DirectionOptionSummary[] = ADMISSION_DIRECTIONS.map((dir) => ({
  id: dir.id,
  instituteId: dir.instituteId,
  instituteName: dir.instituteName,
  majorCode: dir.majorCode,
  majorName: dir.majorName,
  directionName: dir.directionName,
  subject3Code: dir.subjects.subject3Code,
  subject3Name: dir.subjects.subject3Name,
  subject4Code: dir.subjects.subject4Code,
  subject4Name: dir.subjects.subject4Name,
}));

const BIDIRECTIONAL_INSTITUTE_OPTIONS = CAS_INSTITUTES.filter((inst) =>
  ADMISSION_DIRECTIONS.some((d) => d.instituteId === inst.id)
).map((inst) => ({
  id: inst.id,
  name: inst.name,
  shortName: inst.shortName,
  code: inst.code,
  city: inst.city,
}));

const ADVISOR_INSTITUTE_COUNTS = CAS_INSTITUTES.map((inst) => ({
  id: inst.id,
  name: inst.name,
  count: CAS_ADVISORS.filter((a) => a.instituteId === inst.id).length,
}));

const REGION_COUNTS = CAS_INSTITUTES.reduce<Record<string, number>>((acc, inst) => {
  acc[inst.region] = (acc[inst.region] ?? 0) + 1;
  return acc;
}, {});

const TIER_COUNTS = INSTITUTE_DIFFICULTY_TIERS.reduce<Record<string, number>>((acc, tier) => {
  acc[tier] = CAS_INSTITUTES.filter((i) => i.difficultyTier === tier).length;
  return acc;
}, {});

const JOINT_CATEGORIES = Array.from(new Set(CAS_JOINT_PROGRAMS.map((j) => j.programCategory)));

function sanitizeText(value: unknown, maxLen = 80): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function parseRegion(value: unknown): RegionZone | 'ALL' {
  if (typeof value !== 'string' || value === 'ALL') return 'ALL';
  const valid = Object.values(RegionZone) as string[];
  return valid.includes(value) ? (value as RegionZone) : 'ALL';
}

function parseDifficulty(value: unknown): InstituteDifficultyTier | 'ALL' {
  if (typeof value !== 'string' || value === 'ALL') return 'ALL';
  return (INSTITUTE_DIFFICULTY_TIERS as string[]).includes(value)
    ? (value as InstituteDifficultyTier)
    : 'ALL';
}

function parseSortDir(value: unknown, fallback: SortDirection): SortDirection {
  if (value === 'asc' || value === 'desc' || value === 'none') return value;
  return fallback;
}

/** 轻量级每 IP API 请求频率限制，防止恶意批量爬取 */
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 240;
const rateBucket = new Map<string, { count: number; resetAt: number }>();

function apiRateGuard(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (req.path === '/health') return next();

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim() ||
    req.ip ||
    'unknown';
  const now = Date.now();
  const entry = rateBucket.get(clientIp);
  if (!entry || now > entry.resetAt) {
    rateBucket.set(clientIp, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return next();
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
  }
  if (rateBucket.size > 5000) {
    for (const [k, v] of rateBucket.entries()) {
      if (now > v.resetAt) rateBucket.delete(k);
    }
  }
  return next();
}

export function createApiRouter(): Router {
  const router = express.Router();
  router.use(apiRateGuard);

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'cas-bio-toolbox' });
  });

  // === 模块一：院所全景档案与联培专项雷达 ===
  router.get('/institutes', (req, res) => {
    const search = sanitizeText(req.query.search, 80);
    const region = parseRegion(req.query.region);
    const difficulty = parseDifficulty(req.query.difficulty);
    const items = filterInstitutes(CAS_INSTITUTES, search, region, difficulty);
    res.json({
      items,
      totalCount: items.length,
      totalInstitutes: CAS_INSTITUTES.length,
      regionCounts: REGION_COUNTS,
      tierCounts: TIER_COUNTS,
    });
  });

  router.get('/joint-programs', (req, res) => {
    const partnerKeyword = sanitizeText(req.query.partnerKeyword, 80);
    const category = sanitizeText(req.query.category, 40) || 'ALL';
    const items = filterJointPrograms(CAS_JOINT_PROGRAMS, { partnerKeyword, category });
    res.json({
      items,
      totalCount: items.length,
      totalJointCount: CAS_JOINT_PROGRAMS.length,
      categories: JOINT_CATEGORIES,
    });
  });

  // === 模块二：初试科目与院所双向检索 ===
  router.get('/bidirectional', (req, res) => {
    const rawSubjects = sanitizeText(req.query.subjects, 120);
    const selectedSubjectCodes = rawSubjects
      ? rawSubjects
          .split(',')
          .map((s) => s.trim())
          .filter((s) => /^[0-9A-Za-z]{2,8}$/.test(s))
      : [];
    const matchMode = req.query.matchMode === 'ANY' ? 'ANY' : 'ALL';
    const instituteId = sanitizeText(req.query.instituteId, 40) || 'ALL';
    const searchQuery = sanitizeText(req.query.search, 80);
    const degreeType =
      req.query.degreeType === '学术型硕士' || req.query.degreeType === '专业型硕士'
        ? req.query.degreeType
        : 'ALL';
    const onlyJoint = req.query.onlyJoint === 'true';

    const directions = filterBidirectionalDirections(ADMISSION_DIRECTIONS, {
      selectedSubjectCodes,
      matchMode,
      instituteId,
      searchQuery,
      degreeType,
      onlyJoint,
    });

    res.json({
      directions,
      totalCount: directions.length,
      totalDirectionsCount: ADMISSION_DIRECTIONS.length,
      examSubjects: EXAM_SUBJECTS,
      instituteOptions: BIDIRECTIONAL_INSTITUTE_OPTIONS,
    });
  });

  // === 模块三：分数线看板（核心四区间算法与 714 条记录全在服务端运算，严格分页） ===
  router.get('/risks', (req, res) => {
    const rawYear = req.query.year;
    const year: number | 'ALL' =
      rawYear === '2026' || rawYear === '2025' || rawYear === '2024' ? Number(rawYear) : 'ALL';
    const searchQuery = sanitizeText(req.query.search, 80);
    const regionFilter = parseRegion(req.query.region);
    const difficultyFilter = parseDifficulty(req.query.difficulty);
    const thresholdSort = parseSortDir(req.query.thresholdSort, 'desc');
    const ratioSort = parseSortDir(req.query.ratioSort, 'none');

    const rawScore = req.query.targetScore;
    let targetScore: number | null = null;
    if (typeof rawScore === 'string' && rawScore.trim() !== '') {
      const n = Number(rawScore);
      if (Number.isFinite(n) && n >= 0 && n <= 500) {
        targetScore = n;
      }
    }

    const rawZone = req.query.targetZone;
    let targetZone: 'PASSED' | 'ALL' | 1 | 2 | 3 | 4 = 'PASSED';
    if (rawZone === 'ALL' || rawZone === 'PASSED') {
      targetZone = rawZone;
    } else if (rawZone === '1' || rawZone === '2' || rawZone === '3' || rawZone === '4') {
      targetZone = Number(rawZone) as 1 | 2 | 3 | 4;
    }

    const pageSize = clampInt(req.query.pageSize, 1, 50, 30);
    const filtered = sortAndFilterRiskRecords(ADMISSION_RISK_RECORDS, {
      year,
      searchQuery,
      regionFilter,
      difficultyFilter,
      targetScore,
      targetZone,
      thresholdSort,
      ratioSort,
    });

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const currentPage = clampInt(req.query.page, 1, totalPages, 1);
    const start = (currentPage - 1) * pageSize;
    const sliced = filtered.slice(start, start + pageSize);

    const summaryStats = {
      total: totalCount,
      withThreshold: filtered.filter((r) => r.prelimThreshold !== null).length,
      withRatio: filtered.filter(
        (r) =>
          r.applicationRatio !== null ||
          r.reexamCount !== null ||
          r.admittedCount !== null ||
          (r.reexamRatioLabel && r.reexamRatioLabel !== '暂无数据')
      ).length,
      hotCount: filtered.filter((r) => {
        const tier = INSTITUTE_MAP.get(r.instituteId)?.difficultyTier ?? calculateScoreSafetyMetrics(r).zoneTier;
        return tier === 'Extreme' || tier === 'Ultra';
      }).length,
    };

    const items = sliced.map((record) => {
      const inst = INSTITUTE_MAP.get(record.instituteId);
      const metrics = calculateScoreSafetyMetrics(record);
      return {
        record,
        region: inst?.region ?? null,
        difficultyTier: metrics.zoneTier,
        metrics,
        scoreEval:
          targetScore !== null ? evaluateScoreAgainstZones(targetScore, metrics) : null,
      };
    });

    res.json({
      items,
      totalCount,
      totalPages,
      currentPage,
      summaryStats,
      totalRecordsCount: ADMISSION_RISK_RECORDS.length,
    });
  });

  // === 模块四：三级方向探索（剥离 matchRules 与 3,089 语料）与 62 所导师名录 ===
  router.get('/explore/tree', (_req, res) => {
    res.json({
      tree: PUBLIC_RESEARCH_TREE,
      corpusStats: getAdvisorCorpusStats(),
    });
  });

  router.get('/explore/corpus-count', (req, res) => {
    const subId = sanitizeText(req.query.subId, 40);
    const sub = SUB_SPECIALTY_MAP.get(subId);
    if (!sub) {
      return res.status(404).json({ error: '未找到指定细分方向节点' });
    }
    const result = countCorpusMatchesForNode(sub);
    return res.json({ matchingAdvisorCount: result.matchingAdvisorCount });
  });

  router.post('/explore/recommend', (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const level1DomainId = sanitizeText(body.level1DomainId, 40);
    const level2DirectionId = sanitizeText(body.level2DirectionId, 40);
    const level3SubSpecialtyId = sanitizeText(body.level3SubSpecialtyId, 40);
    const extraNotes = sanitizeText(body.extraNotes, 100);

    const dom = RESEARCH_EXPLORATION_TREE.find((d) => d.id === level1DomainId);
    const dir = dom?.directions.find((d) => d.id === level2DirectionId);
    const sub = dir?.subSpecialties.find((s) => s.id === level3SubSpecialtyId);

    if (!dom || !dir || !sub) {
      return res.status(400).json({ error: '请选择有效的一至三级探索路径' });
    }

    const answers: ResearchQuizAnswers = {
      level1DomainId: dom.id,
      level1Domain: dom.name,
      level2DirectionId: dir.id,
      level2Direction: dir.name,
      level3SubSpecialtyId: sub.id,
      level3SubSpecialty: sub.name,
      extraNotes,
    };

    const report = generateLocalDirectionReport(answers);
    return res.json(report);
  });

  router.post('/explore/match-keyword', (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (body.quizCompleted !== true) {
      return res.status(403).json({ error: '请先在工作区一完成三级方向探索后再解锁全库关键词检索' });
    }
    const keyword = sanitizeText(body.keyword, 80);
    if (!keyword) {
      return res.status(400).json({ error: '请输入研究兴趣关键词、专业代码或学科词后再检索' });
    }
    return res.json(matchTeamsLocally(keyword));
  });

  router.get('/advisors/meta', (_req, res) => {
    res.json({
      totalAdvisors: CAS_ADVISORS.length,
      instituteCounts: ADVISOR_INSTITUTE_COUNTS,
    });
  });

  router.get('/advisors', (req, res) => {
    const instituteId = sanitizeText(req.query.instituteId, 40) || 'ioz';
    const searchQuery = sanitizeText(req.query.search, 80);
    const degreeLevel =
      req.query.degreeLevel === '硕士' || req.query.degreeLevel === '博士'
        ? req.query.degreeLevel
        : 'ALL';
    const pageSize = clampInt(req.query.pageSize, 1, 24, 18);
    const page = clampInt(req.query.page, 1, 500, 1);

    const paginated = filterAndPaginateAdvisors(CAS_ADVISORS, {
      instituteId,
      searchQuery,
      degreeLevel,
      page,
      pageSize,
    });
    res.json(paginated);
  });

  router.post('/advisors/profile', (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const advisorId = sanitizeText(body.advisorId, 60);
    const adv = ADVISOR_MAP.get(advisorId);
    if (!adv) {
      return res.status(404).json({ error: '未找到指定导师名录记录' });
    }

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
                significance: '完整论文列表与年度课题进展请点击“访问导师本人主页”查阅。',
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

    return res.json(profile);
  });

  // === 模块五 & 全局目标解析（考纲书目、四区间计算与白皮书上下文） ===
  router.get('/directions/options', (req, res) => {
    const q = sanitizeText(req.query.search, 80).toLowerCase();
    const tokens = q ? q.split(/[\s,，/+]+/).filter(Boolean) : [];
    const items =
      tokens.length === 0
        ? DIRECTION_OPTIONS
        : DIRECTION_OPTIONS.filter((dir) => {
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

    res.json({
      items,
      totalCount: DIRECTION_OPTIONS.length,
    });
  });

  router.get('/whitepaper/context', (req, res) => {
    const directionId = sanitizeText(req.query.directionId, 60);
    const direction = DIRECTION_MAP.get(directionId) ?? ADMISSION_DIRECTIONS[0];
    const institute = INSTITUTE_MAP.get(direction.instituteId) ?? CAS_INSTITUTES[0];

    const riskRecord =
      ADMISSION_RISK_RECORDS.find(
        (r) => r.directionId === direction.id && r.year === 2026
      ) ??
      ADMISSION_RISK_RECORDS.find(
        (r) =>
          r.instituteId === direction.instituteId &&
          r.majorCode === direction.majorCode &&
          r.year === 2026
      ) ??
      ADMISSION_RISK_RECORDS.find(
        (r) => r.instituteId === institute.id && r.year === 2026
      ) ??
      ADMISSION_RISK_RECORDS.find((r) => r.instituteId === institute.id) ??
      null;

    const codes = [direction.subjects.subject3Code, direction.subjects.subject4Code].filter(
      (c) => Boolean(c) && c !== '无'
    );
    const resources = codes
      .map((c) => RESOURCE_MAP.get(c))
      .filter((r): r is NonNullable<typeof r> => Boolean(r));

    const safetyMetrics = riskRecord ? calculateScoreSafetyMetrics(riskRecord) : null;
    const rawGoal = Number(req.query.goalScore);
    const goalScore = Number.isFinite(rawGoal) && rawGoal >= 0 && rawGoal <= 500 ? rawGoal : null;
    const goalZoneEval =
      safetyMetrics && goalScore !== null
        ? evaluateScoreAgainstZones(goalScore, safetyMetrics)
        : null;

    res.json({
      institute,
      direction,
      riskRecord,
      resources,
      safetyMetrics,
      goalZoneEval,
    });
  });

  router.post('/app/resolve-target', (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const advisorId = sanitizeText(body.advisorId, 60);
    const lockPayload =
      body.lockPayload && typeof body.lockPayload === 'object' ? body.lockPayload : null;

    let direction = DIRECTION_MAP.get(sanitizeText(body.directionId, 60));

    if (lockPayload) {
      const pInstId = sanitizeText(lockPayload.instituteId, 40);
      const pInstName = sanitizeText(lockPayload.instituteName, 80);
      const pMajorCode = sanitizeText(lockPayload.majorCode, 20);
      direction =
        ADMISSION_DIRECTIONS.find(
          (d) =>
            (pInstId ? d.instituteId === pInstId : d.instituteName.includes(pInstName)) &&
            d.majorCode === pMajorCode
        ) ??
        ADMISSION_DIRECTIONS.find((d) =>
          pInstId ? d.instituteId === pInstId : d.instituteName.includes(pInstName)
        ) ??
        direction;
    }

    const validDirection = direction ?? ADMISSION_DIRECTIONS[0];
    const institute =
      INSTITUTE_MAP.get(validDirection.instituteId) ??
      INSTITUTE_MAP.get(sanitizeText(body.instituteId, 40)) ??
      CAS_INSTITUTES[0];
    const advisor = advisorId ? ADVISOR_MAP.get(advisorId) ?? null : null;

    res.json({
      institute,
      direction: validDirection,
      advisor,
    });
  });

  return router;
}
