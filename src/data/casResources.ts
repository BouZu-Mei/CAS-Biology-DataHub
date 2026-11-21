/**
 * @file casResources.ts
 * @description 模块五：初试科目官方考纲下载链接、B站/MOOC 推荐视频课程与官方考纲原文参考书目（纯文字，无外部链接）
 * 注：参考书目全部严格核自国科大（admission.ucas.ac.cn）对应科目官方考试大纲 PDF 原文；未单列具体书目的科目（如 349）留空并附原文说明。
 */

import { SubjectPrepResource } from '../types/cas';

export const SUBJECT_PREP_RESOURCES: SubjectPrepResource[] = [
  {
    subjectCode: '338',
    subjectName: '生物化学',
    syllabusTitle: '中国科学院大学 338《生物化学》考试大纲',
    syllabusSummary: [
      '一、生物大分子结构与功能：氨基酸/蛋白质各级结构、分离纯化与酶学动力学。',
      '二、物质与能量代谢：糖酵解、TCA循环、氧化磷酸化、脂类及氨基酸代谢网络。',
      '三、遗传信息传递：DNA复制修复、转录调控、蛋白质生物合成与现代分子技术。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/338%20%E7%94%9F%E7%89%A9%E5%8C%96%E5%AD%A6.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '生物化学（上/下）— 南京大学 杨荣武 主讲',
        instructor: '杨荣武 教授',
        url: 'https://www.icourse163.org/course/NJU-1001625005',
      },
      {
        platform: 'Bilibili',
        title: '338生物化学代谢网络与酶动力学精讲',
        instructor: 'B站公开课',
        url: 'https://search.bilibili.com/all?keyword=338%E7%94%9F%E7%89%A9%E5%8C%96%E5%AD%A6',
      },
    ],
    textbooks: [
      {
        title: '生物化学（上、下册）',
        author: '朱圣庚、徐长法 等',
        publisher: '高等教育出版社',
        edition: '第4版（2017年1月/2016年12月）',
      },
      {
        title: 'Lehninger Principles of Biochemistry',
        author: 'David L. Nelson, Michael M. Cox',
        publisher: 'W.H. Freeman and Company',
        edition: '7th / 8th Edition',
      },
      {
        title: 'Lewin 基因 XII（中文版）',
        author: 'Jocelyn E. Krebs、Elliott S. Goldstein 等主编，江松敏 译',
        publisher: '科学出版社',
        edition: '2021年8月',
      },
    ],
  },
  {
    subjectCode: '888',
    subjectName: '生物学综合',
    syllabusTitle: '中国科学院大学 888《生物学综合》考试大纲',
    syllabusSummary: [
      '一、普通生物学与细胞：膜转运、细胞器分选、细胞周期及动植物生理稳态。',
      '二、遗传学基础：孟德尔与连锁遗传、染色体畸变、数量/群体遗传及分子遗传。',
      '三、微生物学基础：原核/真核微生物及病毒结构、代谢调控与发酵免疫。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/888%20%E7%94%9F%E7%89%A9%E5%AD%A6%E7%BB%BC%E5%90%88.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '普通生物学 — 北京大学等高校精品课',
        instructor: '国家精品课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E6%99%AE%E9%80%9A%E7%94%9F%E7%89%A9%E5%AD%A6',
      },
      {
        platform: 'Bilibili',
        title: '国科大888生物学综合（普生+遗传+微生物）串讲',
        instructor: 'B站生物考研专题',
        url: 'https://search.bilibili.com/all?keyword=888%E7%94%9F%E7%89%A9%E5%AD%A6%E7%BB%BC%E5%90%88',
      },
    ],
    textbooks: [
      {
        title: '陈阅增普通生物学',
        author: '赵进东 主编',
        publisher: '高等教育出版社',
        edition: '第5版（2023年）',
      },
      {
        title: '遗传学',
        author: '刘祖洞 主编',
        publisher: '高等教育出版社',
        edition: '第4版（2021年）',
      },
      {
        title: '微生物学',
        author: '沈萍、陈向东 主编',
        publisher: '高等教育出版社',
        edition: '第9版（2024年）',
      },
    ],
  },
  {
    subjectCode: '612',
    subjectName: '生物化学与分子生物学',
    syllabusTitle: '中国科学院大学 612《生物化学与分子生物学》考试大纲',
    syllabusSummary: [
      '一、蛋白质与核酸化学：一级序列测定、高级结构折叠及核酸Tm热变性性质。',
      '二、酶动力学与三大代谢：米氏动力学、抑制剂判别及糖脂氨代谢交汇调控。',
      '三、分子生物学与技术：中心法则、表观修饰及CRISPR/ChIP/RNA-seq实验设计。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/612%20%E7%94%9F%E7%89%A9%E5%8C%96%E5%AD%A6%E4%B8%8E%E5%88%86%E5%AD%90%E7%94%9F%E7%89%A9%E5%AD%A6.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '生物化学（上/下）— 南京大学 杨荣武 主讲',
        instructor: '杨荣武 教授',
        url: 'https://www.icourse163.org/course/NJU-1001625005',
      },
      {
        platform: 'Bilibili',
        title: '中科院612生化与分子代谢网络及实验专题',
        instructor: 'B站学术公开课',
        url: 'https://search.bilibili.com/all?keyword=612%E7%94%9F%E7%89%A9%E5%8C%96%E5%AD%A6%E4%B8%8E%E5%88%86%E5%AD%90%E7%94%9F%E7%89%A9%E5%AD%A6',
      },
    ],
    textbooks: [
      {
        title: '生物化学（上、下册）',
        author: '朱圣庚、徐长法 编著',
        publisher: '高等教育出版社',
        edition: '第4版（2017年）',
      },
      {
        title: '现代分子生物学',
        author: '朱玉贤、李毅、郑晓峰、郭红卫 编著',
        publisher: '高等教育出版社',
        edition: '第5版（2019年）',
      },
      {
        title: 'Lewin 基因 X（中文版）',
        author: 'J.E.克雷布斯、E.S.戈尔茨坦、S.T.基尔帕特里克 编著',
        publisher: '科学出版社',
        edition: '第1版（2013年）',
      },
    ],
  },
  {
    subjectCode: '852',
    subjectName: '细胞生物学',
    syllabusTitle: '中国科学院大学 852《细胞生物学》考试大纲',
    syllabusSummary: [
      '一、膜结构与内膜分选：生物膜流动镶嵌、跨膜转运、ER-高尔基体囊泡运输。',
      '二、细胞骨架与能量细胞器：微管微丝动态组装、线粒体/叶绿体能量代谢。',
      '三、信号转导与细胞周期：GPCR/RTK/Wnt通路、CDK周期调控、凋亡与自噬。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/852%20%E7%BB%86%E8%83%9E%E7%94%9F%E7%89%A9%E5%AD%A6.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '细胞生物学 — 四川大学 邹方东 / 北师大 桑建利',
        instructor: '邹方东 / 桑建利 教授',
        url: 'https://www.icourse163.org/search.htm?search=%E7%BB%86%E8%83%9E%E7%94%9F%E7%89%A9%E5%AD%A6',
      },
      {
        platform: 'Bilibili',
        title: '852细胞生物学（丁明孝第5版）信号通路精讲',
        instructor: 'B站考研公开课',
        url: 'https://search.bilibili.com/all?keyword=%E7%BB%86%E8%83%9E%E7%94%9F%E7%89%A9%E5%AD%A6+%E4%B8%81%E6%98%8E%E5%AD%9D',
      },
    ],
    textbooks: [
      {
        title: '细胞生物学',
        author: '刘凌云、薛绍白、柳惠图',
        publisher: '高等教育出版社',
        edition: '第1版（2002年）',
      },
      {
        title: '细胞生物学',
        author: '丁明孝、王喜忠、张传茂、陈建国',
        publisher: '高等教育出版社',
        edition: '第5版（2020年）',
      },
    ],
  },
  {
    subjectCode: '621',
    subjectName: '植物学',
    syllabusTitle: '中国科学院大学 621《植物学》考试大纲',
    syllabusSummary: [
      '一、植物解剖与生殖发育：营养器官初/次生结构、花药胚囊及双受精过程。',
      '二、植物系统分类：主要演化类群、APG系统及重要被子植物科属鉴别。',
      '三、植物生理与基因组：光合碳同化、植物激素信号及植物基因组基础。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/621%20%E6%A4%8D%E7%89%A9%E5%AD%A6.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '植物学与植物生理学 — 中国农大/华南农大精品课',
        instructor: '国家一流本科课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E6%A4%8D%E7%89%A9%E5%AD%A6',
      },
      {
        platform: 'Bilibili',
        title: '植物学系统分类与植物生理重点精讲',
        instructor: 'B站植物学公开课',
        url: 'https://search.bilibili.com/all?keyword=%E6%A4%8D%E7%89%A9%E5%AD%A6+%E9%A9%AC%E7%82%9C%E6%A2%81',
      },
    ],
    textbooks: [
      {
        title: '植物学',
        author: '马炜梁 主编',
        publisher: '高等教育出版社',
        edition: '第3版（2022年）',
      },
      {
        title: '植物生物学',
        author: '周云龙 主编',
        publisher: '高等教育出版社',
        edition: '第4版（2016年）',
      },
      {
        title: '植物生理学',
        author: '武维华 主编',
        publisher: '科学出版社',
        edition: '第3版（2018年）',
      },
      {
        title: '基因组学',
        author: '杨焕明 主编',
        publisher: '科学出版社',
        edition: '2016年',
      },
    ],
  },
  {
    subjectCode: '622',
    subjectName: '动物学',
    syllabusTitle: '中国科学院大学 622《动物学》考试大纲',
    syllabusSummary: [
      '一、无脊椎动物演化：原生、刺胞、扁形、环节、软体与节肢动物体制比较。',
      '二、脊椎动物比较解剖：鱼类至哺乳纲循环、呼吸、排泄及神经系统演化。',
      '三、动物地理与保护：中国动物地理区划、行为适应与多样性保护原则。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/622%20%E5%8A%A8%E7%89%A9%E5%AD%A6.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '普通动物学 — 东北师大 / 山东大学精品课',
        instructor: '动物学精品课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E5%8A%A8%E7%89%A9%E5%AD%A6',
      },
      {
        platform: 'Bilibili',
        title: '普通动物学（刘凌云第4版）比较解剖主线精讲',
        instructor: 'B站动物学公开课',
        url: 'https://search.bilibili.com/all?keyword=%E6%99%AE%E9%80%9A%E5%8A%A8%E7%89%A9%E5%AD%A6',
      },
    ],
    textbooks: [
      {
        title: '普通动物学',
        author: '刘凌云、郑光美',
        publisher: '高等教育出版社',
        edition: '第4版（2009年）',
      },
    ],
  },
  {
    subjectCode: '841',
    subjectName: '生态学',
    syllabusTitle: '中国科学院大学 841《生态学》考试大纲',
    syllabusSummary: [
      '一、个体与种群生态：限制因子、逻辑斯蒂方程、r/K对策与种间竞争模型。',
      '二、群落与生态系统：群落演替、多样性测度、能量流动与碳氮生物地球化学循环。',
      '三、全球变化与恢复：景观片段化、碳汇评估与退化生态系统恢复策略。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/841%20%E7%94%9F%E6%80%81%E5%AD%A6.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '基础生态学 — 中山大学 / 东北师大精品课程',
        instructor: '生态学教学名师',
        url: 'https://www.icourse163.org/search.htm?search=%E7%94%9F%E6%80%81%E5%AD%A6',
      },
      {
        platform: 'Bilibili',
        title: '841生态学核心框架与种群计算专题',
        instructor: 'B站生态学考研课',
        url: 'https://search.bilibili.com/all?keyword=841%E7%94%9F%E6%80%81%E5%AD%A6',
      },
    ],
    textbooks: [
      {
        title: '现代生态学',
        author: '戈峰 主编',
        publisher: '科学出版社',
        edition: '第2版（2008年）',
      },
      {
        title: '生态学',
        author: '李博 主编',
        publisher: '高等教育出版社',
        edition: '2000年',
      },
    ],
  },
  {
    subjectCode: '623',
    subjectName: '生物医学综合',
    syllabusTitle: '中国科学院大学 623《生物医学综合》考试大纲',
    syllabusSummary: [
      '一、生理学与医学细胞：神经-体液稳态调节、跨膜信号与肿瘤细胞稳态异常。',
      '二、医学生化与分子：代谢调控异常、基因表达与表观遗传疾病机制。',
      '三、医学免疫学：固有免疫识别、T/B细胞应答及免疫病理转化。',
    ],
    officialSyllabusUrl: 'https://admission.ucas.ac.cn/Content/Upload/2026/7/18.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '生理学与医学免疫学 — 复旦/北大医学部精品课',
        instructor: '医学精品课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E5%8C%BB%E5%AD%A6%E5%85%8D%E7%96%AB%E5%AD%A6',
      },
    ],
    textbooks: [
      {
        title: '生理学',
        author: '朱大年、王庭槐 主编',
        publisher: '人民卫生出版社',
        edition: '第8版（2015年）',
      },
      {
        title: '生物化学与分子生物学',
        author: '查锡良、药立波 主编',
        publisher: '人民卫生出版社',
        edition: '第8版（2017年）',
      },
      {
        title: '医学细胞生物学',
        author: '陈誉华、杨恬、刘艳平',
        publisher: '人民卫生出版社',
        edition: '第5版（2016年）',
      },
      {
        title: '医学免疫学',
        author: '曹雪涛 主编',
        publisher: '人民卫生出版社',
        edition: '第6版（2017年）',
      },
    ],
  },
  {
    subjectCode: '349',
    subjectName: '药学综合',
    syllabusTitle: '中国科学院大学 349《药学综合》考试大纲',
    syllabusSummary: [
      '一、药物化学与药理学：先导化合物优化、量效构效关系及受体动力学。',
      '二、药剂学与药物分析：靶向制剂递送系统、色谱质谱质量控制与药动学。',
    ],
    officialSyllabusUrl: 'https://admission.ucas.ac.cn/Content/Upload/2026/7/28.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '药理学与药物化学 — 中国药科/沈阳药科精品课',
        instructor: '药学教学团队',
        url: 'https://www.icourse163.org/search.htm?search=%E8%8D%AF%E7%90%86%E5%AD%A6',
      },
    ],
    textbooks: [],
    syllabusRefNote:
      '考纲原文仅注：参考书为人民卫生出版社出版的全国高等学校规划教材（非新版也可），未单列具体书名。',
  },
  {
    subjectCode: '301',
    subjectName: '数学（一）',
    syllabusTitle: '全国硕士研究生招生考试 301《数学（一）》考试大纲',
    syllabusSummary: [
      '一、高等数学（约60%）：函数极限连续、一元与多元微积分学、无穷级数及常微分方程。',
      '二、线性代数（约20%）：行列式、矩阵运算、向量组线性相关性、特征值特征向量与二次型。',
      '三、概率论与数理统计（约20%）：随机变量分布、数字特征、大数定律与参数估计假设检验。',
    ],
    officialSyllabusUrl: 'https://yz.chsi.com.cn/',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '高等数学（一）— 同济大学 / 国防科大国家精品课',
        instructor: '国家精品课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E9%AB%98%E7%AD%89%E6%95%B0%E5%AD%A6',
      },
      {
        platform: 'Bilibili',
        title: '考研数学一高等数学、线代与概率核心框架串讲',
        instructor: 'B站考研数学专题',
        url: 'https://search.bilibili.com/all?keyword=301%E6%95%B0%E5%AD%A6%E4%B8%80',
      },
    ],
    textbooks: [],
    syllabusRefNote: '全国统考科目，教育部教育考试院考纲不指定单一参考教材。',
  },
  {
    subjectCode: '302',
    subjectName: '数学（二）',
    syllabusTitle: '全国硕士研究生招生考试 302《数学（二）》考试大纲',
    syllabusSummary: [
      '一、高等数学（约80%）：函数极限连续、一元函数微积分、常微分方程及二重积分（不含空间解析几何/级数）。',
      '二、线性代数（约20%）：行列式、矩阵、向量线性相关性、线性方程组、矩阵特征值与二次型。',
    ],
    officialSyllabusUrl: 'https://yz.chsi.com.cn/',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '高等数学与线性代数 — 同济大学精品课程',
        instructor: '国家精品课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E7%BA%BF%E6%80%A7%E4%BB%A3%E6%95%B0',
      },
      {
        platform: 'Bilibili',
        title: '考研数学二高数与线代重点专题精讲',
        instructor: 'B站考研数学专题',
        url: 'https://search.bilibili.com/all?keyword=302%E6%95%B0%E5%AD%A6%E4%BA%8C',
      },
    ],
    textbooks: [],
    syllabusRefNote: '全国统考科目，教育部教育考试院考纲不指定单一参考教材。',
  },
  {
    subjectCode: '314',
    subjectName: '数学（农）',
    syllabusTitle: '全国硕士研究生招生考试 314《数学（农）》考试大纲',
    syllabusSummary: [
      '一、高等数学：函数极限连续、一元函数微积分学、多元函数微分与二重积分、常微分方程。',
      '二、线性代数与概率论：矩阵行列式、线性方程组与特征值，随机事件概率及参数估计基础。',
    ],
    officialSyllabusUrl: 'https://yz.chsi.com.cn/',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '高等数学与概率统计 — 中国农业大学精品课',
        instructor: '农林数学教学团队',
        url: 'https://www.icourse163.org/search.htm?search=%E6%95%B0%E5%AD%A6%E5%86%9C',
      },
    ],
    textbooks: [],
    syllabusRefNote: '全国统考农学门类科目，教育部教育考试院考纲不指定单一参考教材。',
  },
  {
    subjectCode: '315',
    subjectName: '化学（农）',
    syllabusTitle: '全国硕士研究生招生考试 315《化学（农）》考试大纲',
    syllabusSummary: [
      '一、无机及分析化学：化学热力学基础、溶液四大平衡（酸碱/沉淀/配位/氧化还原）与滴定分析。',
      '二、有机化学：烃类、卤代烃、醇酚醚、醛酮醌、羧酸衍生物及生物大分子立体化学与反应机理。',
    ],
    officialSyllabusUrl: 'https://yz.chsi.com.cn/',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '无机及分析化学与有机化学 — 南京农大/华中农大精品课',
        instructor: '农学化学课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E5%86%9C%E5%AD%A6%E5%8C%96%E5%AD%A6',
      },
    ],
    textbooks: [],
    syllabusRefNote: '全国统考农学门类科目，教育部教育考试院考纲不指定单一参考教材。',
  },
  {
    subjectCode: '339',
    subjectName: '农业知识综合一',
    syllabusTitle: '中国科学院大学 339《农业知识综合一》考试大纲',
    syllabusSummary: [
      '一、植物学：植物细胞组织、营养与生殖器官发育结构、植物系统分类与演化规律。',
      '二、农业生态学：农业生态系统结构、能量流动与物质循环、可持续农业调控策略。',
      '三、土壤学：土壤矿物质与有机质、土壤物理化学性质、养分循环与退化土壤改良。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/339%20%E5%86%9C%E4%B8%9A%E7%9F%A5%E8%AF%86%E7%BB%BC%E5%90%88%E4%B8%80.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '植物学、农业生态学与土壤学 — 农林高校国家精品课',
        instructor: '国家精品课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E5%86%9C%E4%B8%9A%E7%94%9F%E6%80%81%E5%AD%A6',
      },
    ],
    textbooks: [
      {
        title: '植物学',
        author: '马炜梁 主编',
        publisher: '高等教育出版社',
        edition: '2009年',
      },
      {
        title: '农业生态学',
        author: '陈阜 主编',
        publisher: '中国农业大学出版社',
        edition: '2004年',
      },
      {
        title: '土壤学',
        author: '黄昌勇、徐建明 主编',
        publisher: '中国农业出版社',
        edition: '第3版（2010年）',
      },
    ],
  },
  {
    subjectCode: '341',
    subjectName: '农业知识综合三',
    syllabusTitle: '中国科学院大学 341《农业知识综合三》考试大纲',
    syllabusSummary: [
      '一、C语言程序设计：数据类型、分支循环控制、数组指针函数及结构体文件操作。',
      '二、数据库技术与应用：关系模型、SQL数据查询与操纵、规范化理论与事务并发控制。',
      '三、计算机网络技术：OSI/TCP-IP体系结构、路由交换与网络传输应用层协议。',
    ],
    officialSyllabusUrl: 'https://admission.ucas.ac.cn/Content/Upload/2026/7/4.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: 'C语言、数据库系统概论与计算机网络 — 浙大/人大/哈工大精品课',
        instructor: '国家精品课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E6%95%B0%E6%8D%AE%E5%BA%93%E7%B3%BB%E7%BB%9F%E6%A6%82%E8%AE%BA',
      },
    ],
    textbooks: [
      {
        title: 'C程序设计',
        author: '谭浩强 著',
        publisher: '清华大学出版社',
        edition: '第5版（2017年）',
      },
      {
        title: '数据库系统概论',
        author: '王珊 等编著',
        publisher: '高等教育出版社',
        edition: '第6版（2023年）',
      },
      {
        title: '计算机网络',
        author: '谢希仁 编著',
        publisher: '电子工业出版社',
        edition: '第8版（2021年）',
      },
    ],
  },
  {
    subjectCode: '414',
    subjectName: '植物生理学与生物化学',
    syllabusTitle: '全国硕士研究生招生考试 414《植物生理学与生物化学》考试大纲',
    syllabusSummary: [
      '一、植物生理学：水分与矿质营养、光合呼吸代谢、植物激素信号、成花逆境生理。',
      '二、生物化学：蛋白质核酸与酶动力学、糖脂氮代谢网络、复制转录翻译调控机制。',
    ],
    officialSyllabusUrl: 'https://yz.chsi.com.cn/',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '植物生理学与生物化学 — 南京农大/中国农大精品课',
        instructor: '农学精品课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E6%A4%8D%E7%89%A9%E7%94%9F%E7%90%86%E5%AD%A6',
      },
    ],
    textbooks: [],
    syllabusRefNote: '全国统考农学门类联考科目，教育部教育考试院考纲不指定单一参考教材。',
  },
  {
    subjectCode: '417',
    subjectName: '普通生态学与鱼类学',
    syllabusTitle: '中国科学院大学 417《普通生态学与鱼类学》考试大纲',
    syllabusSummary: [
      '一、普通生态学（75分）：生物与环境适应、种群增长与竞争捕食、群落演替与生态系统循环。',
      '二、鱼类学（75分）：鱼类外部形态与内部解剖、系统分类鉴别及重要经济鱼类生态分布。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/417%20%E6%99%AE%E9%80%9A%E7%94%9F%E6%80%81%E5%AD%A6%E4%B8%8E%E9%B1%BC%E7%B1%BB%E5%AD%A6.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '基础生态学与水产鱼类学 — 上海海洋/中山大学精品课',
        instructor: '水产与生态学课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E9%B1%BC%E7%B1%BB%E5%AD%A6',
      },
    ],
    textbooks: [
      {
        title: '基础生态学',
        author: '牛翠娟、娄安如、孙儒泳、李庆芬 等著',
        publisher: '高等教育出版社',
        edition: '第3版（2015年）',
      },
      {
        title: '鱼类学',
        author: '水柏年、赵盛龙、韩志强、朱柏军 编著',
        publisher: '同济大学出版社',
        edition: '2015年',
      },
    ],
  },
  {
    subjectCode: '619',
    subjectName: '物理化学(甲)',
    syllabusTitle: '中国科学院大学 619《物理化学（甲）》考试大纲',
    syllabusSummary: [
      '一、热力学与统计热力学：气体PVT性质、热力学三定律、相平衡与多组分化学平衡计算。',
      '二、动力学、电化学与界面：反应速率理论与催化动力学、电解质电导电池电动势及表面吸附胶体。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/619%20%E7%89%A9%E7%90%86%E5%8C%96%E5%AD%A6%EF%BC%88%E7%94%B2%EF%BC%89.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '物理化学（上/下）— 南京大学 侯文华 等主讲',
        instructor: '侯文华 教授团队',
        url: 'https://www.icourse163.org/search.htm?search=%E7%89%A9%E7%90%86%E5%8C%96%E5%AD%A6+%E5%8D%97%E4%BA%AC%E5%A4%A7%E5%AD%A6',
      },
    ],
    textbooks: [
      {
        title: '物理化学（上、下册）',
        author: '傅献彩、侯文华 编',
        publisher: '高等教育出版社',
        edition: '第6版（2022年）',
      },
    ],
  },
  {
    subjectCode: '801',
    subjectName: '高等代数',
    syllabusTitle: '中国科学院大学 801《高等代数》考试大纲',
    syllabusSummary: [
      '一、多项式与矩阵代数：一元多项式整除互素、行列式计算、线性方程组及二次型正定性。',
      '二、线性空间与变换：维数基变换、特征值与特征向量、Jordan标准形、欧氏空间及矩阵范数。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/801%20%E9%AB%98%E7%AD%89%E4%BB%A3%E6%95%B0.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '高等代数（上/下）— 北京大学 / 复旦大学精品课',
        instructor: '高等代数课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E9%AB%98%E7%AD%89%E4%BB%A3%E6%95%B0',
      },
    ],
    textbooks: [
      {
        title: '高等代数',
        author: '北京大学 编',
        publisher: '高等教育出版社',
        edition: '第3版（2003年7月）',
      },
      {
        title: '线性代数',
        author: '蒋尔雄 等编（复旦大学）',
        publisher: '人民教育出版社',
        edition: '1988年',
      },
      {
        title: '高等代数',
        author: '张禾瑞、郝鈵新',
        publisher: '高等教育出版社',
        edition: '1997年',
      },
    ],
  },
  {
    subjectCode: '806',
    subjectName: '普通物理(乙)',
    syllabusTitle: '中国科学院大学 806《普通物理（乙）》考试大纲',
    syllabusSummary: [
      '一、力学与热学：质点刚体动力学、守恒定律、振动波动及热力学定律气体动理论。',
      '二、电磁、光学与原子物理：静电场稳恒磁场麦克斯韦方程、干涉衍射偏振及量子波粒二象性。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/806%20%E6%99%AE%E9%80%9A%E7%89%A9%E7%90%86%EF%BC%88%E4%B9%99%EF%BC%89.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '大学物理（工科）— 清华/哈工大精品课程',
        instructor: '大学物理课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E5%A4%A7%E5%AD%A6%E7%89%A9%E7%90%86',
      },
    ],
    textbooks: [],
    syllabusRefNote: '考纲原文仅注：全国重点大学工科类普通物理教材，未单列具体书名。',
  },
  {
    subjectCode: '818',
    subjectName: '化工原理',
    syllabusTitle: '中国科学院大学 818《化工原理》考试大纲',
    syllabusSummary: [
      '一、动量与热量传递：流体静力学与柏努利方程、管路计算、过滤沉降与传导对流辐射传热。',
      '二、传质分离单元：气体吸收解吸、精馏塔板与最小回流比计算、萃取干燥及设备选型。',
    ],
    officialSyllabusUrl: 'https://admission.ucas.ac.cn/Content/Upload/2026/7/2.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '化工原理（上/下）— 华东理工大学/天津大学精品课',
        instructor: '化工原理课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E5%8C%96%E5%B7%A5%E5%8E%9F%E7%90%86',
      },
    ],
    textbooks: [
      {
        title: '化工原理（上、下册）',
        author: '陈敏恒、丛德滋、齐鸣斋、潘鹤林、黄婕 编',
        publisher: '化学工业出版社',
        edition: '第5版（上2019/下2020）',
      },
      {
        title: '化工原理学习指导',
        author: '黄婕 主编，刘玉兰、熊丹柳 副主编',
        publisher: '化学工业出版社',
        edition: '第2版（2021年）',
      },
    ],
  },
  {
    subjectCode: '820',
    subjectName: '有机化学',
    syllabusTitle: '中国科学院大学 820《有机化学》考试大纲',
    syllabusSummary: [
      '一、结构与反应机理：电子/空间效应、立体异构、碳正负离子/自由基活性及亲核/亲电反应历程。',
      '二、有机合成与波谱解析：各类官能团转化、周环反应与多步合成路线设计及NMR/IR/MS结构鉴定。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/820%20%E6%9C%89%E6%9C%BA%E5%8C%96%E5%AD%A6.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '基础有机化学 — 北京大学 裴坚 主讲',
        instructor: '裴坚 教授团队',
        url: 'https://www.icourse163.org/search.htm?search=%E5%9F%BA%E7%A1%80%E6%9C%89%E6%9C%BA%E5%8C%96%E5%AD%A6',
      },
    ],
    textbooks: [
      {
        title: '基础有机化学（上、下册）',
        author: '邢其毅、裴伟伟、徐瑞秋、裴坚',
        publisher: '北京大学出版社',
        edition: '第4版（2016年7月）',
      },
      {
        title: '有机化学（上、下）',
        author: '胡宏纹',
        publisher: '高等教育出版社',
        edition: '第4版（2013年）',
      },
      {
        title: '有机化学',
        author: '伍越寰',
        publisher: '中国科学技术大学出版社',
        edition: '第2版（2002年9月）',
      },
    ],
  },
  {
    subjectCode: '825',
    subjectName: '物理化学(乙)',
    syllabusTitle: '中国科学院大学 825《物理化学（乙）》考试大纲',
    syllabusSummary: [
      '一、化学热力学与相平衡：热力学第一二定律、熵与Gibbs自由能、化学平衡及单/双组分相图。',
      '二、动力学、电化学与胶体：化学反应动力学方程、电化学电池电动势、表面吸附及大分子溶液。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/825%20%E7%89%A9%E7%90%86%E5%8C%96%E5%AD%A6%EF%BC%88%E4%B9%99%EF%BC%89.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '物理化学 — 天津大学物理化学国家精品课',
        instructor: '天津大学物理化学教研室',
        url: 'https://www.icourse163.org/search.htm?search=%E7%89%A9%E7%90%86%E5%8C%96%E5%AD%A6+%E5%A4%A9%E6%B4%A5%E5%A4%A7%E5%AD%A6',
      },
    ],
    textbooks: [
      {
        title: '物理化学（上、下册）',
        author: '天津大学物理化学教研室 编',
        publisher: '高等教育出版社',
        edition: '第6版（2017年）',
      },
    ],
  },
  {
    subjectCode: '837',
    subjectName: '电路原理',
    syllabusTitle: '中国科学院大学 837《电路原理》考试大纲',
    syllabusSummary: [
      '一、线性电阻与暂态电路：KCL/KVL网孔节点分析、戴维宁等效、一二阶动态电路时域/复频域分析。',
      '二、正弦稳态与网络：相量法功率匹配、三相电路、互感耦合谐振及二端口网络参数矩阵。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/837%20%E7%94%B5%E8%B7%AF%E5%8E%9F%E7%90%86.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '电路 — 西安交通大学 罗先觉 主讲',
        instructor: '罗先觉 教授团队',
        url: 'https://www.icourse163.org/search.htm?search=%E7%94%B5%E8%B7%AF+%E8%A5%BF%E5%AE%89%E4%BA%A4%E9%80%9A%E5%A4%A7%E5%AD%A6',
      },
    ],
    textbooks: [
      {
        title: '电路',
        author: '邱关源 原著，罗先觉 修订',
        publisher: '高等教育出版社',
        edition: '第5版（2006年5月）',
      },
    ],
  },
  {
    subjectCode: '839',
    subjectName: '地图学与地理信息系统',
    syllabusTitle: '中国科学院大学 839《地图学与地理信息系统》考试大纲',
    syllabusSummary: [
      '一、空间数据结构与制图：矢量/栅格数据转换、地图投影几何变换、拓扑关系与空间数据库管理。',
      '二、空间分析与地学建模：缓冲区与叠加分析、空间自相关、克里金插值、空间回归及DEM数字高程分析。',
    ],
    officialSyllabusUrl: 'https://admission.ucas.ac.cn/Content/Upload/2026/7/6.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '地理信息系统原理 — 武汉大学/南京师大精品课',
        instructor: 'GIS课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E5%9C%B0%E7%90%86%E4%BF%A1%E6%81%AF%E7%B3%BB%E7%BB%9F',
      },
    ],
    textbooks: [
      {
        title: '地理信息系统导论',
        author: '张康聪',
        publisher: '科学出版社',
        edition: '第8版（2016年）',
      },
      {
        title: '地理信息系统空间分析原理',
        author: '周成虎、裴韬 等',
        publisher: '科学出版社',
        edition: '2011年',
      },
    ],
  },
  {
    subjectCode: '842',
    subjectName: '土壤学',
    syllabusTitle: '中国科学院大学 842《土壤学》考试大纲',
    syllabusSummary: [
      '一、土壤物质组成与性质：土壤矿物质、有机质转化、土壤水气热传导及胶体离子交换酸碱缓冲。',
      '二、土壤过程与资源利用：成土过程分类、碳氮磷养分循环、土壤污染退化修复与农业可持续管理。',
    ],
    officialSyllabusUrl:
      'https://admission.ucas.ac.cn/Content/Upload/2025/7/842%20%E5%9C%9F%E5%A3%A4%E5%AD%A6.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '土壤学 — 浙江大学/南京农业大学精品课程',
        instructor: '土壤学课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E5%9C%9F%E5%A3%A4%E5%AD%A6',
      },
    ],
    textbooks: [
      {
        title: '土壤学',
        author: '黄昌勇、徐建明 主编',
        publisher: '中国农业出版社',
        edition: '第3版（2010年）',
      },
    ],
  },
  {
    subjectCode: '859',
    subjectName: '信号与系统',
    syllabusTitle: '中国科学院大学 859《信号与系统》考试大纲',
    syllabusSummary: [
      '一、连续时间系统分析：LTI系统卷积、微分方程、傅里叶级数/变换及拉普拉斯变换与系统函数。',
      '二、离散时间与采样系统：抽样定理、离散序列Z变换、z域流图极零点稳定性及状态变量分析。',
    ],
    officialSyllabusUrl: 'https://admission.ucas.ac.cn/Content/Upload/2026/7/13.pdf',
    videoCourses: [
      {
        platform: '中国大学MOOC',
        title: '信号与系统 — 清华大学/北京邮电大学精品课',
        instructor: '信号与系统课程团队',
        url: 'https://www.icourse163.org/search.htm?search=%E4%BF%A1%E5%8F%B7%E4%B8%8E%E7%B3%BB%E7%BB%9F',
      },
    ],
    textbooks: [
      {
        title: '信号与系统（上、下册）',
        author: '郑君里 等',
        publisher: '高等教育出版社',
        edition: '第4版（2024年）',
      },
      {
        title: '信号与系统',
        author: '奥本海姆 等',
        publisher: '电子工业出版社',
        edition: '第2版（2013年）',
      },
    ],
  },
];
