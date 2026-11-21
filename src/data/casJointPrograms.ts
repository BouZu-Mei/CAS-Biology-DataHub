/**
 * @file casJointPrograms.ts
 * @description 中国科学院联合培养项目与专项计划数据集（含同卷平替推荐对比）
 * 注：聚焦联培载体、专业代码、统考名额规模、培养地点流转路径与初试同卷竞争对比。
 */

import { JointProgram } from '../types/cas';

export const CAS_JOINT_PROGRAMS: JointProgram[] = [
  {
    id: 'jp-hias-cemcs',
    title: '国科大杭高院生命与健康科学学院专项（分子细胞/营养所PI双聘）',
    hostInstituteId: 'cemcs',
    hostInstituteName: '分子细胞中心',
    partnerUnit: '国科大杭州高等研究院',
    programCategory: '国科大杭高院专项',
    majorInfo: '071009 细胞生物学 / 071010 生化分子 / 086001 生物技术与工程',
    quota: 95,
    unifiedQuota: 46,
    trainingTrack:
      '全程在杭州云栖小镇杭高院培养，国科大学籍，含上海分子细胞中心/营养所双聘导师。',
    samePaperComparison: {
      sharedSubjects: '612 + 852 / 338 + 888',
      hostPrelimLine: 360,
      jointPrelimLine: 332,
      hostHeat: '高热度（上海本部报考集中）',
      jointHeat: '中等偏热（同卷双聘通道）',
      recommendationReason:
        '初试同卷 612+852 或 338+888，同享沪区双聘课题组培养，可作为沪区同卷梯度分流选择。',
    },
  },
  {
    id: 'jp-hias-simm',
    title: '国科大杭高院药学院专项（上海药物所联合共建）',
    hostInstituteId: 'simm',
    hostInstituteName: '上海药物所',
    partnerUnit: '国科大杭州高等研究院',
    programCategory: '国科大杭高院专项',
    majorInfo: '071010 生物化学与分子生物学 / 086001 生物技术与工程 / 105500 药学',
    quota: 88,
    unifiedQuota: 42,
    trainingTrack:
      '研一在杭州云栖小镇修课，依托上海药物所双聘团队及张江协同平台科研。',
    samePaperComparison: {
      sharedSubjects: '612 + 852 / 338 + 888 / 349',
      hostPrelimLine: 348,
      jointPrelimLine: 324,
      hostHeat: '高（张江本部报考基数大）',
      jointHeat: '中高（杭州本地同卷通道）',
      recommendationReason:
        '初试与上海药物所同卷衔接，保留国科大学籍与双聘体系，仍须冲刺高分保障复试竞争力。',
    },
  },
  {
    id: 'jp-gibh-scut',
    title: '广州健康院 × 华南理工大学“干细胞与再生医学”联培专项',
    hostInstituteId: 'gibh',
    hostInstituteName: '广州健康院',
    partnerUnit: '华南理工大学',
    programCategory: '大湾区联培专项',
    majorInfo: '071009 细胞生物学 / 086000 生物与医药',
    quota: 36,
    unifiedQuota: 22,
    trainingTrack:
      '研一在华南理工大学城修课，研二研三在广州黄埔广州健康院开展实验。',
    samePaperComparison: {
      sharedSubjects: '612 + 852 / 338 + 888',
      hostPrelimLine: 335,
      jointPrelimLine: 312,
      hostHeat: '中上（大湾区报考集中）',
      jointHeat: '协同（高校联培协同培养）',
      recommendationReason:
        '可进入广州健康院细胞谱系核心方向科研，依托985高校联培通道分散竞争。',
    },
  },
  {
    id: 'jp-gibh-ustc',
    title: '广州健康院 × 中国科学技术大学联合培养计划',
    hostInstituteId: 'gibh',
    hostInstituteName: '广州健康院',
    partnerUnit: '中国科学技术大学',
    programCategory: '大湾区联培专项',
    majorInfo: '071010 生物化学与分子生物学 / 071009 细胞生物学',
    quota: 30,
    unifiedQuota: 14,
    trainingTrack:
      '中科大学籍，研一在合肥中科大西区修课，研二回广州健康院进组实验。',
    samePaperComparison: {
      sharedSubjects: '612/852 与中科大生医部统考考点高度重合',
      hostPrelimLine: 335,
      jointPrelimLine: 328,
      hostHeat: '中上',
      jointHeat: '高（C9高校学籍联合培养）',
      recommendationReason:
        '共享中科大培养体系与广州健康院科研平台，聚焦干细胞与免疫方向。',
    },
  },
  {
    id: 'jp-siat-sustech',
    title: '深圳先进院 × 南方科技大学 / 深圳大学联合培养专项',
    hostInstituteId: 'siat',
    hostInstituteName: '深圳先进院',
    partnerUnit: '南方科技大学 / 深圳大学',
    programCategory: '大湾区联培专项',
    majorInfo: '086000 生物与医药 / 071000 生物学 / 083100 生物医学工程',
    quota: 75,
    unifiedQuota: 48,
    trainingTrack:
      '全程在深圳西丽大学城完成课程与科研，双导师衔接合成生物与医工平台。',
    samePaperComparison: {
      sharedSubjects: '338 + 888 / 612 + 888',
      hostPrelimLine: 332,
      jointPrelimLine: 308,
      hostHeat: '较高（生物医药与工科交叉热门）',
      jointHeat: '中等（大湾区同城联培通道）',
      recommendationReason:
        '沿用 338+888 备考框架即可衔接，同城大学城双导师科研氛围浓厚。',
    },
  },
  {
    id: 'jp-ioz-hbu',
    title: '动物所 × 河北大学“干细胞与生殖生物”京津冀联培专项',
    hostInstituteId: 'ioz',
    hostInstituteName: '动物研究所',
    partnerUnit: '河北大学',
    programCategory: '京外所高校联培',
    majorInfo: '071000 生物学 / 086000 生物与医药',
    quota: 45,
    unifiedQuota: 35,
    trainingTrack:
      '研一在河北大学保定校区修课，研二研三进驻北京动物研究所本部科研。',
    samePaperComparison: {
      sharedSubjects: '612 + 852 / 338 + 888',
      hostPrelimLine: 350,
      jointPrelimLine: 302,
      hostHeat: '高（京区核心生物学研究所）',
      jointHeat: '低-中等（京津冀协同通道）',
      recommendationReason:
        '进入北京动物所国家重点实验室开展干细胞与生殖研究，依托高校联培通道分散京区本部单极竞争。',
    },
  },
  {
    id: 'jp-kiz-ynu',
    title: '昆明动物所 × 云南大学“西南生物多样性”联合培养计划',
    hostInstituteId: 'kiz',
    hostInstituteName: '昆明动物所',
    partnerUnit: '云南大学',
    programCategory: '京外所高校联培',
    majorInfo: '071002 动物学 / 071007 遗传学 / 086000 生物与医药',
    quota: 42,
    unifiedQuota: 32,
    trainingTrack:
      '全程在昆明市区培养，共享昆明动物所灵长类平台与云南大学生态遗传学科。',
    samePaperComparison: {
      sharedSubjects: '612 + 888 / 622 + 888',
      hostPrelimLine: 310,
      jointPrelimLine: 292,
      hostHeat: '中等',
      jointHeat: '协同（滇区高校联培梯度通道）',
      recommendationReason:
        '同城高校与研究所深度联培，无跨省迁徙，专注进化基因组与疾病模型。',
    },
  },
  {
    id: 'jp-tib-tju',
    title: '天津工业生物技术研究所 × 天津大学/江南大学联培专项',
    hostInstituteId: 'tib',
    hostInstituteName: '天津工生所',
    partnerUnit: '天津大学 / 江南大学',
    programCategory: '产业专项班',
    majorInfo: '086000 生物与医药 / 071010 生物化学与分子生物学',
    quota: 68,
    unifiedQuota: 50,
    trainingTrack:
      '研一在合作高校修课，研二起进驻天津工生所合成淀粉与酶工程中心科研。',
    samePaperComparison: {
      sharedSubjects: '338 生物化学 + 888 生物学综合',
      hostPrelimLine: 318,
      jointPrelimLine: 298,
      hostHeat: '中等',
      jointHeat: '协同（双一流工科协同）',
      recommendationReason:
        '以 338+888 备考顺畅衔接，直接参与国家级合成生物制造与 AI 酶工程研究。',
    },
  },
  {
    id: 'jp-whiov-hubu',
    title: '武汉病毒所 × 湖北大学/华中农业大学联培项目',
    hostInstituteId: 'whiov',
    hostInstituteName: '武汉病毒所',
    partnerUnit: '湖北大学 / 华中农业大学',
    programCategory: '京外所高校联培',
    majorInfo: '071005 微生物学 / 086000 生物与医药',
    quota: 40,
    unifiedQuota: 29,
    trainingTrack:
      '同城武汉高校修读基础课，核心实验在武汉病毒所郑店及小洪山园区完成。',
    samePaperComparison: {
      sharedSubjects: '612 + 888 / 338 + 888',
      hostPrelimLine: 326,
      jointPrelimLine: 304,
      hostHeat: '中等偏上',
      jointHeat: '协同（同城联培衔接顺畅）',
      recommendationReason:
        '专业课备考内容与病毒所本部同构，武汉同城培养衔接便利。',
    },
  },
  {
    id: 'jp-cib-scu',
    title: '成都生物所 × 四川大学/电子科技大学联培专项',
    hostInstituteId: 'cib',
    hostInstituteName: '成都生物所',
    partnerUnit: '四川大学 / 电子科技大学',
    programCategory: '京外所高校联培',
    majorInfo: '071002 动物学 / 071300 生态学 / 086001 生物技术与工程',
    quota: 38,
    unifiedQuota: 28,
    trainingTrack:
      '研一在成都合作高校或国科大成都学院修课，研二进入天府新区生物所园区。',
    samePaperComparison: {
      sharedSubjects: '338 + 888 / 621 + 888',
      hostPrelimLine: 314,
      jointPrelimLine: 295,
      hostHeat: '中等',
      jointHeat: '协同（西南地区高校联培通道）',
      recommendationReason:
        '依托成都本地教学资源与川渝高校联培通道，有效分散本部初试高分竞争。',
    },
  },
];
