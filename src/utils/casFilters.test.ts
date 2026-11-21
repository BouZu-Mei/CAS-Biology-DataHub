/**
 * @file casFilters.test.ts
 * @description 纯逻辑、三级学术图谱、三年实证数据、四区间分数线、官方考纲书目与合规性单元测试（node:test + assert/strict）
 */

import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { CAS_INSTITUTES } from '../data/casInstitutes';
import { CAS_JOINT_PROGRAMS } from '../data/casJointPrograms';
import {
  ADMISSION_DIRECTIONS,
  ADMISSION_RISK_RECORDS,
  EXAM_SUBJECTS,
} from '../data/casSubjectsAndAdmissions';
import { CAS_ADVISORS } from '../data/casAdvisors';
import { SUBJECT_PREP_RESOURCES } from '../data/casResources';
import { RESEARCH_EXPLORATION_TREE } from '../data/casResearchTree';
import { SIDEBAR_NAV_ITEMS } from '../components/SidebarNav';
import {
  calculateScoreSafetyMetrics,
  computeZoneBoundaries,
  countCorpusMatchesForNode,
  evaluateScoreAgainstZones,
  filterAndPaginateAdvisors,
  filterBidirectionalDirections,
  filterInstitutes,
  filterJointPrograms,
  generateLocalDirectionReport,
  getAdvisorCorpusStats,
  getRiskFieldMissingRates,
  INSTITUTE_DIFFICULTY_TIERS,
  matchTeamsLocally,
  preRankAdvisorsByKeyword,
  resolveSubSpecialtyDirections,
  sortAndFilterRiskRecords,
} from './casFilters';
import { RegionZone } from '../types/cas';

const REQUIRED_56_UNITS = [
  '成都生物研究所',
  '西北高原生物研究所',
  '西双版纳热带植物园',
  '分子植物科学卓越创新中心',
  '动物研究所',
  '昆明动物研究所',
  '上海营养与健康研究所',
  '水生生物研究所',
  '微生物研究所',
  '上海药物研究所',
  '武汉病毒研究所',
  '沈阳应用生态研究所',
  '深圳先进技术研究院',
  '青岛生物能源与过程研究所',
  '天津工业生物技术研究所',
  '脑科学与智能技术卓越创新中心',
  '上海有机化学研究所',
  '生命科学学院',
  '植物研究所',
  '生物物理研究所',
  '遗传与发育生物学研究所',
  '广州生物医药与健康研究院',
  '福建物质结构研究所',
  '昆明植物研究所',
  '华南植物园',
  '近代物理研究所',
  '杭州高等研究院',
  '医学院',
  '纳米科学与工程学院',
  '生态环境研究中心',
  '地理科学与资源研究所',
  '东北地理与农业生态研究所',
  '成都山地灾害与环境研究所',
  '西北生态环境资源研究院',
  '资源与环境学院',
  '中丹学院',
  '新疆生态与地理研究所',
  '武汉植物园',
  '南京土壤研究所',
  '遗传与发育生物学研究所农业资源研究中心',
  '亚热带农业生态研究所',
  '青藏高原研究所',
  '城市环境研究所',
  '电工研究所',
  '宁波材料技术与工程研究所',
  '杭州医学研究所',
  '上海应用物理研究所',
  '大连化学物理研究所',
  '兰州化学物理研究所',
  '过程工程研究所',
  '海洋研究所',
  '上海高等研究院',
  '精密测量科学与技术创新研究院',
  '南海海洋研究所',
  '国家纳米科学中心',
  '烟台海岸带研究所',
];

const SHANGHAI_IDS = ['cemcs', 'cebsit', 'cemps', 'sinh', 'simm', 'sinap', 'sioc', 'sari'];
const NANJING_IDS = ['niglas', 'issas'];

test('CAS_INSTITUTES covers all 62 units (excluding 玉泉书院), omits teachingDuration, and keeps Shanghai & Nanjing local', () => {
  assert.equal(CAS_INSTITUTES.length, 62);
  assert.equal(
    CAS_INSTITUTES.some((i) => i.id === 'ucas-yq' || i.name.includes('玉泉书院')),
    false,
    'ucas-yq / 玉泉书院 must be removed'
  );

  const allNames = CAS_INSTITUTES.map((i) => i.name).join(' | ');
  for (const unit of REQUIRED_56_UNITS) {
    assert.ok(allNames.includes(unit), `Missing required unit: ${unit}`);
  }

  for (const inst of CAS_INSTITUTES) {
    assert.equal('teachingDuration' in inst, false, `${inst.id} should not have teachingDuration`);
  }

  const beijingInstitutes = CAS_INSTITUTES.filter((i) => i.region === RegionZone.BEIJING);
  assert.ok(beijingInstitutes.length >= 12);
  for (const inst of beijingInstitutes) {
    assert.ok(inst.centralizedCampus.includes('雁栖湖'), `Beijing unit ${inst.name} must go to Yanqihu`);
  }

  const gibh = CAS_INSTITUTES.find((i) => i.id === 'gibh');
  assert.ok(gibh && gibh.centralizedCampus.includes('雁栖湖'));

  for (const id of [...SHANGHAI_IDS, ...NANJING_IDS]) {
    const unit = CAS_INSTITUTES.find((i) => i.id === id);
    assert.ok(unit, `Missing Shanghai/Nanjing unit: ${id}`);
    const combined = `${unit.centralizedCampus} ${unit.teachingNote}`;
    assert.ok(combined.includes('不赴京'), `${unit.name} must indicate 不赴京`);
    assert.equal(/(?<!不)赴京|雁栖湖|赴北京/.test(combined), false, `${unit.name} must NOT go to Beijing/Yanqihu`);
  }
});

test('Sidebar navigation keeps primary titles <= 7 chars, renames 03 to 分数线看板, and omits subtitles for 01-04', () => {
  assert.equal(SIDEBAR_NAV_ITEMS.length, 5);
  assert.equal(SIDEBAR_NAV_ITEMS[2].title, '分数线看板');
  for (const item of SIDEBAR_NAV_ITEMS) {
    assert.ok(item.title.length <= 7, `Sidebar title too long (${item.title.length}): ${item.title}`);
    if (['01', '02', '03', '04'].includes(item.index)) {
      assert.equal(item.subtitle, undefined, `Sidebar ${item.index} should not have subtitle`);
    } else if (item.subtitle) {
      assert.ok(
        item.subtitle.length <= 15,
        `Sidebar subtitle too long (${item.subtitle.length}): ${item.subtitle}`
      );
    }
  }
});

test('filterInstitutes enforces 5-tier ratings and >= ProMax floor for HQ/Beijing/Shanghai units', () => {
  const tierSet = new Set(CAS_INSTITUTES.map((i) => i.difficultyTier));
  for (const tier of INSTITUTE_DIFFICULTY_TIERS) {
    assert.ok(tierSet.has(tier), `Missing institute difficulty tier: ${tier}`);
    const matchedTier = filterInstitutes(CAS_INSTITUTES, '', 'ALL', tier);
    assert.ok(matchedTier.length >= 1 && matchedTier.every((inst) => inst.difficultyTier === tier));
  }
  assert.equal(
    CAS_INSTITUTES.every((i) => INSTITUTE_DIFFICULTY_TIERS.includes(i.difficultyTier)),
    true
  );

  const proMaxOrAbove = new Set(['Extreme', 'Ultra', 'ProMax']);
  for (const inst of CAS_INSTITUTES) {
    if (
      inst.id.startsWith('ucas-') ||
      inst.region === RegionZone.BEIJING ||
      inst.region === RegionZone.SHANGHAI
    ) {
      assert.ok(
        proMaxOrAbove.has(inst.difficultyTier),
        `HQ/BJ/SH unit ${inst.name} (${inst.id}) must be >= ProMax, got ${inst.difficultyTier}`
      );
    }
  }

  const shanghaiOnly = filterInstitutes(CAS_INSTITUTES, '', RegionZone.SHANGHAI);
  assert.equal(shanghaiOnly.length, 8);
  assert.ok(shanghaiOnly.every((inst) => inst.region === RegionZone.SHANGHAI));

  const searchIbp = filterInstitutes(CAS_INSTITUTES, '80112', 'ALL');
  assert.equal(searchIbp.length, 1);
  assert.equal(searchIbp[0].id, 'ibp');

  const hiasPrograms = filterJointPrograms(CAS_JOINT_PROGRAMS, {
    partnerKeyword: '杭高院',
  });
  assert.equal(hiasPrograms.length, 2);
});

test('filterBidirectionalDirections aligns with 241 UCAS catalog subjects (086000 -> 338+888, cebsit -> 612+852)', () => {
  assert.equal(ADMISSION_DIRECTIONS.length, 241);
  assert.equal(
    ADMISSION_DIRECTIONS.some((d) => d.instituteId === 'ucas-yq'),
    false
  );

  const combo338And888 = filterBidirectionalDirections(ADMISSION_DIRECTIONS, {
    selectedSubjectCodes: ['338', '888'],
    matchMode: 'ALL',
  });
  assert.ok(combo338And888.length >= 25);
  assert.ok(
    combo338And888.every(
      (d) => d.subjects.subject3Code === '338' && d.subjects.subject4Code === '888'
    )
  );

  const cebsitNeuro = ADMISSION_DIRECTIONS.find(
    (d) => d.instituteId === 'cebsit' && d.majorCode === '071006'
  );
  assert.ok(cebsitNeuro);
  assert.equal(cebsitNeuro.subjects.subject3Code, '612');
  assert.equal(cebsitNeuro.subjects.subject4Code, '852');
});

test('ADMISSION_RISK_RECORDS covers 238 unified-exam majors across 2026, 2025, 2024 (714 records total)', () => {
  assert.equal(ADMISSION_RISK_RECORDS.length, 714);
  assert.equal(
    ADMISSION_RISK_RECORDS.some((r) => r.instituteId === 'ucas-yq'),
    false
  );
  for (const yr of [2026, 2025, 2024] as const) {
    const byYear = ADMISSION_RISK_RECORDS.filter((r) => r.year === yr);
    assert.equal(byYear.length, 238, `Expected 238 majors for year ${yr}`);
  }

  for (const inst of CAS_INSTITUTES) {
    const matched = sortAndFilterRiskRecords(ADMISSION_RISK_RECORDS, {
      year: 'ALL',
      searchQuery: inst.shortName,
      ratioSort: 'desc',
    });
    assert.ok(matched.length >= 3, `Expected 3-year records for ${inst.name}`);
  }

  const empiricalRows = sortAndFilterRiskRecords(ADMISSION_RISK_RECORDS, {
    year: 'ALL',
    onlyWithEmpiricalData: true,
    ratioSort: 'desc',
  });
  assert.ok(empiricalRows.length >= 400);
});

test('getRiskFieldMissingRates and 4-zone tier-escalating scoring metrics work accurately', () => {
  const rates = getRiskFieldMissingRates(ADMISSION_RISK_RECORDS);
  assert.ok(rates.reexamCount > 70);
  assert.ok(rates.admittedCount > 70);
  assert.ok(rates.applicationRatio > 70);
  assert.ok(rates.admittedMin > 70);
  assert.ok(rates.admittedMedian > 70);
  assert.ok(rates.admittedMax > 70);

  assert.ok(rates.plannedQuota <= 70);
  assert.equal(rates.prelimThreshold, 0);
  assert.ok(rates.singleLineNote <= 70);

  // 2024-2026 各学科门类 A 区国家线最低底线核验
  const nationalLineFloors: Record<number, Record<string, number>> = {
    2026: { '07': 275, '08': 264, '09': 240, '10': 294 },
    2025: { '07': 274, '08': 260, '09': 245, '10': 293 },
    2024: { '07': 288, '08': 273, '09': 251, '10': 304 },
  };
  for (const r of ADMISSION_RISK_RECORDS) {
    const floor = nationalLineFloors[r.year]?.[r.majorCode.slice(0, 2)] ?? 240;
    assert.ok(
      r.prelimThreshold !== null && r.prelimThreshold >= floor,
      `${r.id} threshold ${r.prelimThreshold} < national line ${floor}`
    );
  }

  // 1) 验证同一公开线下，五档难度（Plus < Pro < ProMax < Ultra < Extreme）区间起始线递增
  const ascTiers = ['Plus', 'Pro', 'ProMax', 'Ultra', 'Extreme'] as const;
  for (const sampleT of [240, 264, 275, 300, 320, 348, 360]) {
    for (let i = 1; i < ascTiers.length; i++) {
      const prev = computeZoneBoundaries(sampleT, ascTiers[i - 1]);
      const curr = computeZoneBoundaries(sampleT, ascTiers[i]);
      assert.ok(curr.z2Start >= prev.z2Start, `z2Start decreased at t=${sampleT}`);
      assert.ok(curr.z3Start >= prev.z3Start, `z3Start decreased at t=${sampleT}`);
      assert.ok(curr.z4Start >= prev.z4Start, `z4Start decreased at t=${sampleT}`);
    }
  }

  // 2) 验证“越低越疏松、越高越密集”：低分数线区间步长与总跨度显著更宽，高分数线区间更紧凑
  const lowBounds = computeZoneBoundaries(240, 'Plus');
  const highBounds = computeZoneBoundaries(375, 'Extreme');
  assert.ok(lowBounds.z4Start - lowBounds.z1Start > highBounds.z4Start - highBounds.z1Start);
  assert.ok(lowBounds.z2Start - lowBounds.z1Start > highBounds.z2Start - highBounds.z1Start);

  // 3) 验证 300 分在最低所处于区间 1 中游，且全库 300 分绝不进入区间 2/3/4；400 分必已跨过最高所区间 4 门槛
  const plus240Pos = (300 - lowBounds.z1Start) / (lowBounds.z2Start - lowBounds.z1Start);
  assert.ok(plus240Pos > 0.35 && plus240Pos < 0.7, `300 pos in Plus(240) Z1 = ${plus240Pos}`);
  const plus275Bounds = computeZoneBoundaries(275, 'Plus');
  const plus275Pos = (300 - plus275Bounds.z1Start) / (plus275Bounds.z2Start - plus275Bounds.z1Start);
  assert.ok(plus275Pos > 0.3 && plus275Pos < 0.7, `300 pos in Plus(275) Z1 = ${plus275Pos}`);

  // 4) 全库 714 条记录核验：4 个区间、z2Start > 300、z4Start <= 399 (<400)、区间宽度 w1>=w2>=w3
  const validRiskTiers = new Set([...INSTITUTE_DIFFICULTY_TIERS, '暂无数据']);
  for (const r of ADMISSION_RISK_RECORDS) {
    const m = calculateScoreSafetyMetrics(r);
    assert.ok(validRiskTiers.has(m.riskLevel), `Invalid 5-tier riskLevel: ${m.riskLevel}`);
    assert.equal(m.scoreZones.length, 4);
    assert.equal(m.scoreZones[0].startScore, r.prelimThreshold);
    assert.equal(m.scoreZones[0].isDanger, true);
    assert.equal(m.scoreZones[0].label, '危险擦线区');

    const [z1, z2, z3, z4] = m.scoreZones;
    const w1 = z2.startScore - z1.startScore;
    const w2 = z3.startScore - z2.startScore;
    const w3 = z4.startScore - z3.startScore;
    assert.ok(w1 >= w2 && w2 >= w3, `Width monotonicity violated in ${r.id}: ${w1}/${w2}/${w3}`);
    assert.ok(z2.startScore > 300, `${r.id} z2Start (${z2.startScore}) must exceed 300`);
    assert.ok(z4.startScore <= 399, `${r.id} z4Start (${z4.startScore}) must be < 400`);

    const at300 = evaluateScoreAgainstZones(300, m);
    assert.ok(at300?.status === 'below' || at300?.status === 'zone1', `300 cannot exceed zone1 in ${r.id}`);
    const at400 = evaluateScoreAgainstZones(400, m);
    assert.equal(at400?.status, 'zone4', `400 must cross zone4 in ${r.id}`);

    const atLine = evaluateScoreAgainstZones(r.prelimThreshold!, m);
    assert.equal(atLine?.status, 'zone1');
    const belowLine = evaluateScoreAgainstZones(r.prelimThreshold! - 1, m);
    assert.equal(belowLine?.status, 'below');
  }

  // 5) 验证模块三区域筛选、报考难度筛选及按输入分数筛选区间 1/2/3/4
  const instMap = new Map(CAS_INSTITUTES.map((i) => [i.id, i]));
  const bjExtreme = sortAndFilterRiskRecords(ADMISSION_RISK_RECORDS, {
    year: 2026,
    regionFilter: RegionZone.BEIJING,
    difficultyFilter: 'Extreme',
  });
  assert.ok(bjExtreme.length >= 10);
  assert.ok(
    bjExtreme.every((r) => {
      const inst = instMap.get(r.instituteId);
      return inst?.region === RegionZone.BEIJING && inst?.difficultyTier === 'Extreme';
    })
  );

  for (const targetZ of [1, 2, 3, 4] as const) {
    const scoreHits = sortAndFilterRiskRecords(ADMISSION_RISK_RECORDS, {
      year: 2026,
      targetScore: 378,
      targetZone: targetZ,
    });
    assert.ok(scoreHits.length >= 1, `Expected hits for 378 in zone ${targetZ}`);
    assert.ok(
      scoreHits.every(
        (r) => evaluateScoreAgainstZones(378, calculateScoreSafetyMetrics(r))?.status === `zone${targetZ}`
      )
    );
  }

  const asc = sortAndFilterRiskRecords(ADMISSION_RISK_RECORDS, {
    year: 2026,
    thresholdSort: 'asc',
  });
  const numericAsc = asc.filter((r) => r.prelimThreshold !== null);
  assert.ok(numericAsc.length >= 200);
  for (let i = 1; i < numericAsc.length; i++) {
    assert.ok((numericAsc[i].prelimThreshold ?? 0) >= (numericAsc[i - 1].prelimThreshold ?? 0));
  }
  const firstNullAsc = asc.findIndex((r) => r.prelimThreshold === null);
  assert.ok(firstNullAsc >= numericAsc.length || firstNullAsc === -1);

  const ibp2026 = ADMISSION_RISK_RECORDS.find((r) => r.id === 'risk-ibp-071009-2026');
  assert.ok(ibp2026);
  const ibpMetrics = calculateScoreSafetyMetrics(ibp2026);
  assert.equal(ibpMetrics.prelimThreshold, 348);
  assert.equal(ibpMetrics.riskLevel, 'Extreme');
  assert.equal(ibpMetrics.zoneTier, 'Extreme');

  const noDataMetrics = calculateScoreSafetyMetrics({
    ...ibp2026,
    prelimThreshold: null,
    applicationRatio: null,
    admittedMin: null,
    admittedMedian: null,
    admittedMax: null,
  });
  assert.equal(noDataMetrics.riskLevel, '暂无数据');
  assert.equal(noDataMetrics.scoreZones.length, 0);
  assert.equal(noDataMetrics.recommendedSafeTarget, null);
});

test('CAS_ADVISORS covers all 62 CAS units (3,089 advisors) and paginates by institute', () => {
  assert.equal(CAS_ADVISORS.length, 3089);
  const instSet = new Set(CAS_ADVISORS.map((a) => a.instituteId));
  assert.equal(instSet.size, 62);
  assert.equal(instSet.has('ucas-yq'), false);

  const iozPage1 = filterAndPaginateAdvisors(CAS_ADVISORS, {
    instituteId: 'ioz',
    page: 1,
    pageSize: 18,
  });
  assert.ok(iozPage1.totalCount >= 50);
  assert.equal(iozPage1.items.length, 18);
  assert.ok(iozPage1.items.every((a) => a.instituteId === 'ioz'));

  const proteinMatches = preRankAdvisorsByKeyword(CAS_ADVISORS, 'AI蛋白质设计');
  assert.ok(proteinMatches.length >= 3);
});

test('3-level balanced tree removes L4, integrates 3,089 advisors, covers 62 institutes x 241 directions, and curates 10-20 sorted hits', () => {
  assert.equal(RESEARCH_EXPLORATION_TREE.length, 12);

  const stats = getAdvisorCorpusStats();
  assert.equal(stats.totalAdvisorsAnalyzed, 3089);
  assert.ok(stats.uniqueTopicsCount >= 1000);

  let l2Count = 0;
  let l3Count = 0;
  const l2Sizes = new Set<number>();
  const l3Sizes = new Set<number>();
  const coveredDirIds = new Set<string>();
  const coveredInstIds = new Set<string>();

  for (const dom of RESEARCH_EXPLORATION_TREE) {
    assert.ok(
      dom.directions.length >= 6 && dom.directions.length <= 9,
      `Level-2 count out of natural range in ${dom.id}: ${dom.directions.length}`
    );
    l2Sizes.add(dom.directions.length);
    l2Count += dom.directions.length;
    for (const dir of dom.directions) {
      assert.ok(
        dir.subSpecialties.length >= 3 && dir.subSpecialties.length <= 7,
        `Level-3 count out of natural range in ${dir.id}: ${dir.subSpecialties.length}`
      );
      l3Sizes.add(dir.subSpecialties.length);
      l3Count += dir.subSpecialties.length;
      for (const sub of dir.subSpecialties) {
        assert.equal('interestOptions' in sub, false, `L4 interestOptions must be removed in ${sub.id}`);
        assert.equal('teamTargets' in sub, false);
        assert.ok(Array.isArray(sub.keyMethods) && sub.keyMethods.length >= 1, `Missing keyMethods in ${sub.id}`);

        const corpusInfo = countCorpusMatchesForNode(sub);
        assert.ok(corpusInfo.matchingAdvisorCount >= 1, `No advisor corpus match for ${sub.id}`);

        const resolved = resolveSubSpecialtyDirections(sub, ADMISSION_DIRECTIONS, '');
        assert.ok(resolved.length >= 10, `Expected >= 10 curated matches for ${sub.id}, got ${resolved.length}`);
        for (let i = 1; i < resolved.length; i++) {
          assert.ok(resolved[i - 1].score >= resolved[i].score, `Not sorted desc in ${sub.id}`);
        }
        for (const r of resolved) {
          coveredDirIds.add(r.direction.id);
          coveredInstIds.add(r.direction.instituteId);
        }
      }
    }
  }

  assert.ok(l2Sizes.size >= 3, 'Level-2 counts should vary naturally across domains');
  assert.ok(l3Sizes.size >= 3, 'Level-3 counts should vary naturally across directions');
  assert.ok(l2Count >= 75 && l2Count <= 105);
  assert.ok(l3Count >= 300 && l3Count <= 450);
  assert.equal(coveredDirIds.size, ADMISSION_DIRECTIONS.length);
  assert.equal(coveredInstIds.size, CAS_INSTITUTES.length);

  // 验证精选报告恒定输出 10-20 个高相关方向
  for (const dom of RESEARCH_EXPLORATION_TREE) {
    const dir = dom.directions[0];
    const sub = dir.subSpecialties[0];
    const report = generateLocalDirectionReport({
      level1DomainId: dom.id,
      level1Domain: dom.name,
      level2DirectionId: dir.id,
      level2Direction: dir.name,
      level3SubSpecialtyId: sub.id,
      level3SubSpecialty: sub.name,
      extraNotes: '',
    });
    assert.equal(report.engineUsed, 'local-academic-graph');
    assert.ok(
      report.recommendedTeams.length >= 10 && report.recommendedTeams.length <= 20,
      `Expected 10-20 recommendedTeams for ${sub.id}, got ${report.recommendedTeams.length}`
    );
    for (const team of report.recommendedTeams) {
      assert.ok(team.instituteName && team.majorCode && team.directionName);
      assert.equal('researchGroupOrTeam' in team, false);
      assert.equal('advisorName' in team, false);
      assert.equal('careerOutlook' in team, false);
    }
  }

  for (const kw of ['生物电工', '海洋生物学', '作物学', '肿瘤免疫', '药学', '生态水文', '辐射生物学']) {
    const res = matchTeamsLocally(kw);
    assert.ok(res.matches.length >= 1 && res.matches.length <= 20, `Expected 1-20 matches for keyword: ${kw}`);
    for (const m of res.matches) {
      assert.ok(m.directionName && m.instituteName && m.majorCode);
      assert.equal('researchGroupOrTeam' in m, false);
      assert.equal('advisorName' in m, false);
    }
  }
});

test('Official PDF textbooks match UCAS syllabi verbatim, 349 leaves textbooks empty, and zero forbidden terms exist', () => {
  const findRes = (code: string) => SUBJECT_PREP_RESOURCES.find((r) => r.subjectCode === code);

  assert.ok(findRes('338')?.textbooks.some((t) => t.author.includes('朱圣庚')));
  assert.ok(findRes('888')?.textbooks.some((t) => t.author.includes('赵进东')));
  assert.ok(findRes('888')?.textbooks.some((t) => t.author.includes('刘祖洞')));
  assert.ok(findRes('888')?.textbooks.some((t) => t.author.includes('沈萍')));
  assert.ok(findRes('612')?.textbooks.some((t) => t.author.includes('朱玉贤')));
  assert.ok(findRes('852')?.textbooks.some((t) => t.author.includes('丁明孝')));
  assert.ok(findRes('621')?.textbooks.some((t) => t.author.includes('马炜梁')));
  assert.ok(findRes('622')?.textbooks.some((t) => t.author.includes('刘凌云')));
  assert.ok(findRes('841')?.textbooks.some((t) => t.author.includes('戈峰')));
  assert.ok(findRes('623')?.textbooks.some((t) => t.author.includes('曹雪涛')));

  const r349 = findRes('349');
  assert.ok(r349);
  assert.equal(r349.textbooks.length, 0);
  assert.ok(r349.syllabusRefNote && r349.syllabusRefNote.includes('未单列'));

  for (const res of SUBJECT_PREP_RESOURCES) {
    for (const tb of res.textbooks) {
      assert.equal('purchaseOrInfoUrl' in tb, false);
    }
  }

  const forbiddenRegex = /进面|被刷|面试|补助|津贴|奖助|学费|宿舍|住宿/;
  const serialized = JSON.stringify({
    CAS_INSTITUTES,
    CAS_JOINT_PROGRAMS,
    EXAM_SUBJECTS,
    ADMISSION_DIRECTIONS,
    ADMISSION_RISK_RECORDS,
    CAS_ADVISORS,
    SUBJECT_PREP_RESOURCES,
    RESEARCH_EXPLORATION_TREE,
  });
  const match = serialized.match(forbiddenRegex);
  assert.equal(match, null, `Found forbidden term in dataset: ${match?.[0]}`);
});

test('Compliance: AI API removed, empty score input in M3, no current-year banner in Sidebar, no understated copy', () => {
  const m3Source = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/Module3RiskDashboard.tsx'),
    'utf8'
  );
  const m4Source = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/Module4AIAdvisorHub.tsx'),
    'utf8'
  );
  const m5Source = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/Module5Whitepaper.tsx'),
    'utf8'
  );
  const sidebarSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/SidebarNav.tsx'),
    'utf8'
  );
  const pdfSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/utils/pdfWhitepaper.ts'),
    'utf8'
  );
  const serverSource = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
  const pkgSource = fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8');

  assert.equal(/自选查阅导师|CAS_ADVISORS|CasAdvisor|targetAdvisor/.test(m5Source), false);
  assert.equal(/自选查阅导师|CasAdvisor|targetAdvisor/.test(pdfSource), false);
  assert.ok(m3Source.includes('分数线看板'));
  assert.equal(/三年报录看板|仅看实证条目/.test(m3Source), false);
  assert.ok(m3Source.includes('区域筛选') && m3Source.includes('报考难度') && m3Source.includes('按总分定位/筛选区间'));
  assert.ok(m3Source.includes("useState<string>('')"));
  assert.equal(/useState<number>\(345\)/.test(m3Source), false);
  assert.ok(m3Source.includes('危险擦线'));

  assert.ok(m5Source.includes('INSTITUTE_DIFFICULTY_META') && m5Source.includes('报考难度与分数线四区间定位'));

  const m1Source = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/Module1Panorama.tsx'),
    'utf8'
  );
  assert.equal(/\.tagline/.test(m1Source), false);
  assert.equal(/\.tagline|zone\.description|越低越疏松|越高越密集/.test(m5Source), false);
  assert.equal(
    /考情核验与官方总分线四区间定位|越低越疏松|越高越密集|四区间标尺|刚过公开线仍属危险擦线区|zone\.description|\.tagline/.test(
      m3Source
    ),
    false
  );

  assert.equal(
    /备考衔接要点|客观在任导师名录|融合全量|院系所 → 专业代码 → 官方方向/.test(m4Source),
    false
  );

  assert.equal(/当前备考|targetYear/.test(sidebarSource), false);
  assert.equal(/\/api\/ai|@google\/genai/.test(serverSource), false);
  assert.equal(/@google\/genai/.test(pkgSource), false);

  const combinedUiAndServer = [m1Source, m3Source, m4Source, m5Source, sidebarSource, pdfSource, serverSource].join('\n');
  const understatedRegex =
    /高性价比|友好|贴线|稳步上岸|不做虚拟团队与预设导师推荐|当前备考|\/api\/ai|third-party-ai|engineMode|showApiDocDrawer|玉泉书院|ucas-yq/;
  const badMatch = combinedUiAndServer.match(understatedRegex);
  assert.equal(badMatch, null, `Found removed phrase/token: ${badMatch?.[0]}`);
});
