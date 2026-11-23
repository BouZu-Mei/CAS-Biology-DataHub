/**
 * @file cas.ts
 * @description 中国科学院生物考研智能百宝箱核心数据模型与类型定义
 * 注：聚焦院所集中教学、联培专项、初试科目、2024-2026三年官方分数线与难度分级、
 * 三级级联理想方向探索（匹配至院系所-专业-官方招生方向）及 62 所全量生物导师名录。
 */

/** 左侧边栏核心导航模块枚举 */
export enum NavModule {
  PANORAMA = 'panorama', // 模块一：院所全景介绍与联培雷达
  BIDIRECTIONAL = 'bidirectional', // 模块二：初试科目与院所双向检索
  RISK_DASHBOARD = 'risk_dashboard', // 模块三：分数线看板
  AI_ADVISOR = 'ai_advisor', // 模块四：三级方向探索与 62 所生物导师名录中心
  WHITEPAPER = 'whitepaper', // 模块五：初试考纲资源与个人备考白皮书
}

/** 院所所属区域分类 */
export enum RegionZone {
  BEIJING = '京区所/直属院系',
  SHANGHAI = '沪区所',
  GUANGSHEN = '广深华南',
  EAST_CENTRAL = '华东华中',
  WEST_NORTHEAST = '西南西北东北',
}

/** 院所报考难度五档定级（由高到低：Extreme > Ultra > ProMax > Pro > Plus） */
export type InstituteDifficultyTier = 'Extreme' | 'Ultra' | 'ProMax' | 'Pro' | 'Plus';

/** 院所/培养单位基础档案（含研一集中教学信息与报考难度定级） */
export interface CasInstitute {
  id: string;
  code: string;
  name: string;
  shortName: string;
  city: string;
  region: RegionZone;
  difficultyTier: InstituteDifficultyTier;
  coreDisciplines: string[];
  centralizedCampus: string;
  teachingNote: string;
  overview: string;
  admissionsUrl: string;
  recruitmentFeature: string;
}

/** 联培项目与专项计划（聚焦培养路径与初试同卷衔接） */
export interface JointProgram {
  id: string;
  title: string;
  hostInstituteId: string;
  hostInstituteName: string;
  partnerUnit: string;
  programCategory: '国科大杭高院专项' | '京外所高校联培' | '大湾区联培专项' | '产业专项班';
  majorInfo: string;
  quota: number;
  unifiedQuota: number;
  trainingTrack: string;
  samePaperComparison: {
    sharedSubjects: string;
    hostPrelimLine: number;
    jointPrelimLine: number;
    hostHeat: string;
    jointHeat: string;
    recommendationReason: string;
  };
}

/** 初试专业课科目元信息 */
export interface ExamSubject {
  code: string;
  name: string;
  setter: '国科大统考命题' | '全国统考/联考命题';
  category:
    | '生化分子类'
    | '细胞遗传类'
    | '生态植物动物类'
    | '医药与生物综合'
    | '化学生物与交叉工科'
    | '农学与数学基础';
  scopeNote: string;
}

/** 招生方向与初试科目组合条目（用于双向检索） */
export interface AdmissionDirection {
  id: string;
  instituteId: string;
  instituteName: string;
  isJointProgram: boolean;
  jointProgramTitle: string | null;
  majorCode: string;
  majorName: string;
  degreeType: '学术型硕士' | '专业型硕士';
  directionName: string;
  subjects: {
    politics: string;
    english: string;
    subject3Code: string;
    subject3Name: string;
    subject4Code: string;
    subject4Name: string;
  };
}

/** 报录竞争与初试分数线统计数据（2026 / 2025 / 2024，未公开字段显式置 null 并标注“暂无数据”） */
export interface AdmissionRiskRecord {
  id: string;
  directionId: string;
  instituteId: string;
  instituteName: string;
  majorCode: string;
  majorName: string;
  directionLabel: string;
  subjectCombo: string;
  year: 2026 | 2025 | 2024;
  /** 拟招生总人数（未公开则为 null） */
  plannedQuota: number | null;
  /** 统考预计招生名额（未公开则为 null） */
  unifiedRemainingQuota: number | null;
  /** 统考进入复试人数（官网复试名单统计，未公开则为 null） */
  reexamCount: number | null;
  /** 统考实际录取人数（官网拟录取名单统计，未公开则为 null） */
  admittedCount: number | null;
  /** 推免占比（百分比 0-100，未公开则为 null） */
  exemptRatioPct: number | null;
  /** 复试录取比说明（由 reexamCount / admittedCount 计算或官方规定，缺失为“暂无数据”） */
  reexamRatioLabel: string;
  /** 用于排序的数值化复试录取比（未公开则为 null） */
  applicationRatio: number | null;
  /** 院所初试复试总分基准线（未公开则为 null） */
  prelimThreshold: number | null;
  /** 单科线说明 */
  singleLineNote: string;
  /** 拟录取初试最低分（未公开则为 null） */
  admittedMin: number | null;
  /** 拟录取初试中位分（未公开则为 null） */
  admittedMedian: number | null;
  /** 拟录取初试最高分（未公开则为 null） */
  admittedMax: number | null;
  riskNote: string;
  dataSourceNote: string;
}

/** 中科院 62 所全量生物导师基础名录档案 */
export interface CasAdvisor {
  id: string;
  name: string;
  title: string;
  instituteId: string;
  instituteName: string;
  department: string;
  keywords: string[];
  researchSummary: string;
  /** 经核验的官方导师库/个人主页/所网站检索入口 */
  labUrl: string;
  email: string;
  recentPapersContext: string[];
  recruitingMajors: string[];
  /** 招生层级（硕士 / 博士 / 硕博） */
  degreeLevels?: string[];
}

/** 初试科目备考资源（考纲、视频、参考书；参考书目不附带外部链接） */
export interface SubjectPrepResource {
  subjectCode: string;
  subjectName: string;
  syllabusTitle: string;
  syllabusSummary: string[];
  officialSyllabusUrl: string;
  videoCourses: {
    platform: 'Bilibili' | '中国大学MOOC';
    title: string;
    instructor: string;
    url: string;
  }[];
  textbooks: {
    title: string;
    author: string;
    publisher: string;
    edition: string;
  }[];
  /** 当官方考纲 PDF 未单列具体书名时，标注官方原话说明 */
  syllabusRefNote?: string;
}

/** 细分小方向对全量 62 所 × 241 条官方招生方向的匹配规则 */
export interface SubSpecialtyMatchRules {
  majorCodes?: string[];
  majorPrefixes?: string[];
  keywords?: string[];
  instituteIds?: string[];
}

/** 第 3 级：细分小方向（如鱼类、两栖爬行、细胞器自噬等） */
export interface SubSpecialtyNode {
  id: string;
  name: string;
  summary: string;
  keyMethods: string[];
  matchRules: SubSpecialtyMatchRules;
}

/** 第 2 级：研究方向（如动物形态学、动物发育学、生物地理等） */
export interface ResearchDirectionNode {
  id: string;
  name: string;
  summary: string;
  subSpecialties: SubSpecialtyNode[];
}

/** 第 1 级：生物学研究领域（如动物学、植物学、生态学、生物化学等） */
export interface BiologyDomainNode {
  id: string;
  name: string;
  badge: string;
  subtitle: string;
  directions: ResearchDirectionNode[];
}

/** 三级级联理想方向探索路径参数 */
export interface ResearchQuizAnswers {
  level1DomainId: string;
  level1Domain: string;
  level2DirectionId: string;
  level2Direction: string;
  level3SubSpecialtyId: string;
  level3SubSpecialty: string;
  extraNotes: string;
}

/** 三级探索输出报告（严格止步于 报考院系所 -> 报考专业 -> 官方招生方向，按相关度精选 10-20 个方向） */
export interface AIDirectionReport {
  engineUsed: 'local-academic-graph';
  providerLabel: string;
  headline: string;
  profileSummary: string;
  recommendedTeams: {
    instituteId?: string;
    instituteName: string;
    majorCode: string;
    majorName: string;
    directionName: string;
    degreeType?: string;
    suggestedSubjects: string;
    matchReason: string;
    advisorFocusNote?: string;
    matchedAdvisorDirections?: number;
    advisorDirectionTopics?: string[];
  }[];
  preparationAdvice: string[];
}

/** 方向/专业语义匹配响应（探索完成后解锁，覆盖全部 62 所招生方向与 3,089 导师方向语料） */
export interface AIAdvisorMatchResponse {
  engineUsed?: 'local-academic-graph';
  queryInterpretation: string;
  matches: {
    instituteId?: string;
    instituteName: string;
    majorCode: string;
    majorName: string;
    directionName: string;
    degreeType?: string;
    fitLevel: '高度契合' | '重点推荐' | '交叉拓展';
    matchReason: string;
    examSubjects: string;
    matchedAdvisorDirections?: number;
    advisorDirectionTopics?: string[];
  }[];
}

/** 导师公开方向脉络解读返回结构 */
export interface AIAdvisorDeepProfile {
  advisorName: string;
  instituteName: string;
  plainLanguageResearch: string;
  threeYearBreakthroughs: {
    yearOrTheme: string;
    breakthroughTitle: string;
    significance: string;
  }[];
  researchPrepGuide: {
    topic: string;
    rationale: string;
    readingSuggestion: string;
  }[];
  emailPitchTip: string;
}

/** 考生个人备考目标（跨模块同步 & 用于生成作战白皮书 PDF） */
export interface UserTargetPlan {
  candidateName: string;
  targetYear: number;
  instituteId: string;
  directionId: string;
  /** 已选定的报考专业与方向（由三级探索锁定） */
  targetTeamName: string;
  /** 仅在用户主动从名录中选用或留空 */
  advisorId: string;
  /** 是否已完成三级理想方向探索 */
  directionQuizCompleted: boolean;
  customGoalScore: number;
  selectedSubjectCodes: string[];
}

/** 公开线之上 4 个分段的展示 DTO（计算逻辑仅在服务端） */
export interface ScoreZone {
  zoneIndex: 1 | 2 | 3 | 4;
  label: string;
  startScore: number;
  endScore: number | null;
  isDanger: boolean;
  barClass: string;
  textClass: string;
  description: string;
}

export interface ScoreSafetyMetrics {
  prelimThreshold: number | null;
  admittedMin: number | null;
  admittedMedian: number | null;
  admittedMax: number | null;
  safeMarginOverThreshold: number | null;
  recommendedSafeTarget: number | null;
  hasScoreRange: boolean;
  riskLevel: InstituteDifficultyTier | '暂无数据';
  zoneTier: InstituteDifficultyTier;
  scoreZones: ScoreZone[];
  axisMin: number;
  axisMax: number;
}

export interface ScoreEvaluationResult {
  status: 'below' | 'zone1' | 'zone2' | 'zone3' | 'zone4';
  label: string;
  detail: string;
  textClass: string;
}

export interface RiskRecordPageItem {
  record: AdmissionRiskRecord;
  region: RegionZone | null;
  difficultyTier: InstituteDifficultyTier;
  metrics: ScoreSafetyMetrics;
  scoreEval: ScoreEvaluationResult | null;
}

/** 前端可见的三级树展示节点（已剥离匹配规则与语料库关键词） */
export interface PublicSubSpecialtyNode {
  id: string;
  name: string;
  summary: string;
  keyMethods: string[];
}

export interface PublicResearchDirectionNode {
  id: string;
  name: string;
  summary: string;
  subSpecialties: PublicSubSpecialtyNode[];
}

export interface PublicBiologyDomainNode {
  id: string;
  name: string;
  badge: string;
  subtitle: string;
  directions: PublicResearchDirectionNode[];
}

export interface DirectionOptionSummary {
  id: string;
  instituteId: string;
  instituteName: string;
  majorCode: string;
  majorName: string;
  directionName: string;
  subject3Code: string;
  subject3Name: string;
  subject4Code: string;
  subject4Name: string;
}

export interface WhitepaperContextResponse {
  institute: CasInstitute;
  direction: AdmissionDirection;
  riskRecord: AdmissionRiskRecord | null;
  resources: SubjectPrepResource[];
  safetyMetrics: ScoreSafetyMetrics | null;
  goalZoneEval: ScoreEvaluationResult | null;
}

