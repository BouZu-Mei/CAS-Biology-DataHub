/**
 * @file pdfWhitepaper.ts
 * @description 《中科院生物考研作战白皮书.pdf》生成引擎与考纲文本导出工具
 * 采用高分辨率 HTML5 Canvas 排版渲染中文学术字体与 Lancet 配色矢量图，
 * 随后封装为标准 A4 多页 PDF 文件直接触发浏览器下载，彻底避免中文字体乱码。
 */

import { jsPDF } from 'jspdf';
import {
  AdmissionDirection,
  AdmissionRiskRecord,
  CasInstitute,
  SubjectPrepResource,
  UserTargetPlan,
} from '../types/cas';
import { calculateScoreSafetyMetrics } from './casFilters';

export interface WhitepaperPayload {
  plan: UserTargetPlan;
  institute: CasInstitute;
  direction: AdmissionDirection;
  riskRecord: AdmissionRiskRecord | null;
  resources: SubjectPrepResource[];
  aiInsightSummary?: string;
}

const PAGE_W = 1240; // 150 DPI A4 width
const PAGE_H = 1754; // 150 DPI A4 height
const MARGIN_X = 76;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

function createPageCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法初始化 PDF 渲染画布');
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  return { canvas, ctx };
}

/**
 * 自动换行文本绘制，返回结束后的 Y 坐标
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  font: string,
  color: string
): number {
  ctx.font = font;
  ctx.fillStyle = color;
  let currentY = y;
  const paragraphs = text.split('\n');

  for (const para of paragraphs) {
    let line = '';
    for (let i = 0; i < para.length; i++) {
      const char = para[i];
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
        ctx.fillText(line, x, currentY);
        line = char;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.length > 0) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }
  }
  return currentY;
}

/**
 * 绘制页面底部页码与学术页脚
 */
function drawFooter(ctx: CanvasRenderingContext2D, pageNum: number, totalPages: number, plan: UserTargetPlan) {
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X, PAGE_H - 76);
  ctx.lineTo(PAGE_W - MARGIN_X, PAGE_H - 76);
  ctx.stroke();

  ctx.font = '400 18px "Noto Sans SC", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText(
    `中国科学院生物考研智能百宝箱 · ${plan.candidateName || '备考考生'}专属作战白皮书`,
    MARGIN_X,
    PAGE_H - 44
  );

  const pageLabel = `第 ${pageNum} / ${totalPages} 页`;
  const w = ctx.measureText(pageLabel).width;
  ctx.fillText(pageLabel, PAGE_W - MARGIN_X - w, PAGE_H - 44);
}

/**
 * 绘制 Lancet 风格章节小标题
 */
function drawSectionHeader(ctx: CanvasRenderingContext2D, indexLabel: string, title: string, y: number): number {
  ctx.fillStyle = '#00407A';
  ctx.fillRect(MARGIN_X, y, 8, 30);

  ctx.font = '700 26px "Noto Sans SC", sans-serif';
  ctx.fillStyle = '#0F172A';
  ctx.fillText(`${indexLabel}  ${title}`, MARGIN_X + 22, y + 25);

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X, y + 44);
  ctx.lineTo(PAGE_W - MARGIN_X, y + 44);
  ctx.stroke();

  return y + 70;
}

/**
 * 生成并触发下载《中科院生物考研作战白皮书.pdf》
 */
export async function generateAndDownloadWhitepaperPDF(payload: WhitepaperPayload): Promise<void> {
  const { plan, institute, direction, riskRecord, resources, aiInsightSummary } = payload;

  const subject4Text =
    direction.subjects.subject4Code && direction.subjects.subject4Code !== '无'
      ? ` + ${direction.subjects.subject4Code} ${direction.subjects.subject4Name}`
      : '（300分制统考综合）';

  // 第一页：战略总览 + 院所集中教学 + 初试科目与竞争安全区标尺
  const page1 = createPageCanvas();
  const ctx1 = page1.ctx;

  ctx1.fillStyle = '#00407A';
  ctx1.fillRect(0, 0, PAGE_W, 210);
  ctx1.fillStyle = '#AD1E24';
  ctx1.fillRect(0, 210, PAGE_W, 8);

  ctx1.font = '700 40px "Noto Sans SC", sans-serif';
  ctx1.fillStyle = '#FFFFFF';
  ctx1.fillText('中国科学院生物考研作战白皮书', MARGIN_X, 92);

  ctx1.font = '400 22px "Noto Sans SC", sans-serif';
  ctx1.fillStyle = '#CBD5E1';
  ctx1.fillText(
    `备考考生：${plan.candidateName || '未命名考生'}   |   生成日期：${new Date().toLocaleDateString('zh-CN')}`,
    MARGIN_X,
    146
  );

  let y = 260;
  const tileW = (CONTENT_W - 24) / 2;
  const tileH = 128;

  const tiles = [
    {
      bg: '#F8FAFC',
      border: '#CBD5E1',
      label: '目标培养单位（院所代码 ' + institute.code + '）',
      value: institute.name,
      sub: `${institute.city} · ${institute.region}`,
    },
    {
      bg: '#F8FAFC',
      border: '#CBD5E1',
      label: '报考专业与方向',
      value: `${direction.majorCode} ${direction.majorName}（${direction.degreeType}）`,
      sub: direction.directionName,
    },
    {
      bg: '#00407A',
      border: '#00407A',
      label: '初试统考科目组合',
      value: `${direction.subjects.subject3Code} ${direction.subjects.subject3Name}${subject4Text}`,
      sub: `${direction.subjects.politics} · ${direction.subjects.english}`,
      dark: true,
    },
    {
      bg: '#006B77',
      border: '#006B77',
      label: '培养地点安排',
      value: institute.centralizedCampus,
      sub: institute.teachingNote,
      dark: true,
    },
  ];

  tiles.forEach((t, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const tx = MARGIN_X + col * (tileW + 24);
    const ty = y + row * (tileH + 20);

    ctx1.fillStyle = t.bg;
    ctx1.fillRect(tx, ty, tileW, tileH);
    ctx1.strokeStyle = t.border;
    ctx1.lineWidth = 1.5;
    ctx1.strokeRect(tx, ty, tileW, tileH);

    ctx1.font = '500 18px "Noto Sans SC", sans-serif';
    ctx1.fillStyle = t.dark ? '#BAE6FD' : '#64748B';
    ctx1.fillText(t.label, tx + 22, ty + 34);

    ctx1.font = '700 22px "Noto Sans SC", sans-serif';
    ctx1.fillStyle = t.dark ? '#FFFFFF' : '#0F172A';
    const clippedVal = t.value.length > 26 ? t.value.slice(0, 25) + '…' : t.value;
    ctx1.fillText(clippedVal, tx + 22, ty + 72);

    ctx1.font = '400 17px "Noto Sans SC", sans-serif';
    ctx1.fillStyle = t.dark ? '#E0F2FE' : '#475569';
    const clippedSub = t.sub.length > 34 ? t.sub.slice(0, 33) + '…' : t.sub;
    ctx1.fillText(clippedSub, tx + 22, ty + 104);
  });

  y += tileH * 2 + 64;

  y = drawSectionHeader(ctx1, '01', '院所档案与集中教学部署', y);
  y = drawWrappedText(
    ctx1,
    `• 核心优势学科：${institute.coreDisciplines.join(' / ')}\n• 培养地点衔接：${institute.teachingNote}\n• 统考招生研判：${institute.recruitmentFeature}`,
    MARGIN_X,
    y,
    CONTENT_W,
    34,
    '400 20px "Noto Sans SC", sans-serif',
    '#1E293B'
  );
  y += 28;

  y = drawSectionHeader(ctx1, '02', '招生计划与官方分数线核验', y);
  if (riskRecord) {
    const metrics = calculateScoreSafetyMetrics(riskRecord);
    const statItems = [
      { k: '统计年份', v: `${riskRecord.year} 届` },
      { k: '拟招生计划', v: riskRecord.plannedQuota !== null ? `${riskRecord.plannedQuota} 人` : '暂无数据' },
      { k: '官方总分线', v: riskRecord.prelimThreshold !== null ? `${riskRecord.prelimThreshold} 分` : '暂无数据' },
      { k: '竞争定级', v: metrics.riskLevel },
    ];

    const cellW = CONTENT_W / 4;
    ctx1.fillStyle = '#F8FAFC';
    ctx1.fillRect(MARGIN_X, y, CONTENT_W, 88);
    ctx1.strokeStyle = '#CBD5E1';
    ctx1.strokeRect(MARGIN_X, y, CONTENT_W, 88);

    statItems.forEach((item, i) => {
      const cx = MARGIN_X + i * cellW;
      if (i > 0) {
        ctx1.beginPath();
        ctx1.moveTo(cx, y + 14);
        ctx1.lineTo(cx, y + 74);
        ctx1.strokeStyle = '#E2E8F0';
        ctx1.stroke();
      }
      ctx1.font = '400 16px "Noto Sans SC", sans-serif';
      ctx1.fillStyle = '#64748B';
      ctx1.fillText(item.k, cx + 16, y + 32);

      ctx1.font = '700 20px "JetBrains Mono", "Noto Sans SC", sans-serif';
      ctx1.fillStyle = item.v === '暂无数据' ? '#64748B' : item.k === '官方总分线' ? '#006B77' : '#00407A';
      ctx1.fillText(item.v, cx + 16, y + 66);
    });

    y += 116;

    const goalTarget = metrics.recommendedSafeTarget
      ? Math.max(plan.customGoalScore, metrics.recommendedSafeTarget)
      : plan.customGoalScore;

    y = drawWrappedText(
      ctx1,
      `单科线口径：${riskRecord.singleLineNote}\n个人目标锚定：建议初试目标设定为【${goalTarget} 分】以上。${riskRecord.riskNote}`,
      MARGIN_X,
      y,
      CONTENT_W,
      32,
      '500 18px "Noto Sans SC", sans-serif',
      '#0F172A'
    );
  } else {
    y = drawWrappedText(
      ctx1,
      `当前个人目标设定分数为 ${plan.customGoalScore} 分（该方向公开渠道暂无量化分段数据，请以院所官方最新公告为准）。`,
      MARGIN_X,
      y,
      CONTENT_W,
      32,
      '400 19px "Noto Sans SC", sans-serif',
      '#334155'
    );
  }

  drawFooter(ctx1, 1, 2, plan);

  // 第二页：锁定研究方向 + 科目考纲教材清单 + 全年初试作战时间轴
  const page2 = createPageCanvas();
  const ctx2 = page2.ctx;

  ctx2.fillStyle = '#00407A';
  ctx2.fillRect(0, 0, PAGE_W, 24);

  let y2 = 76;
  y2 = drawSectionHeader(ctx2, '03', '锁定研究方向与阶段规划', y2);

  if (plan.targetTeamName) {
    y2 = drawWrappedText(
      ctx2,
      `三级探索锁定方向：${plan.targetTeamName}`,
      MARGIN_X,
      y2,
      CONTENT_W,
      30,
      '700 20px "Noto Sans SC", sans-serif',
      '#00407A'
    );
    y2 += 14;
  } else {
    y2 = drawWrappedText(
      ctx2,
      '尚未完成三级研究方向探索。建议前往模块四完成「生物学领域 -> 研究方向 -> 细分小方向」三级级联探索，获取对口报考院所与方向建议。',
      MARGIN_X,
      y2,
      CONTENT_W,
      32,
      '400 19px "Noto Sans SC", sans-serif',
      '#475569'
    );
    y2 += 24;
  }

  if (aiInsightSummary) {
    y2 = drawWrappedText(
      ctx2,
      `方向探索研判备忘：${aiInsightSummary}`,
      MARGIN_X,
      y2,
      CONTENT_W,
      30,
      '500 18px "Noto Sans SC", sans-serif',
      '#006B77'
    );
    y2 += 22;
  }

  y2 = drawSectionHeader(ctx2, '04', '初试专业课考纲与核心参考书单', y2);
  for (const res of resources.slice(0, 2)) {
    ctx2.font = '700 21px "Noto Sans SC", sans-serif';
    ctx2.fillStyle = '#00407A';
    ctx2.fillText(`[${res.subjectCode}] ${res.subjectName}`, MARGIN_X, y2);
    y2 += 32;

    const books =
      res.textbooks.length > 0
        ? res.textbooks.map((b) => `《${b.title}》(${b.author})`).join('、')
        : res.syllabusRefNote || '考纲原文未单列具体书名';
    const videos = res.videoCourses.map((v) => `[${v.platform}] ${v.title}`).join('；');
    const summaryText = `• 参考教材：${books}\n• 推荐网课：${videos}\n• 考纲核心：${res.syllabusSummary.slice(0, 2).join(' ')}`;

    y2 = drawWrappedText(
      ctx2,
      summaryText,
      MARGIN_X + 12,
      y2,
      CONTENT_W - 12,
      30,
      '400 18px "Noto Sans SC", sans-serif',
      '#1E293B'
    );
    y2 += 22;
  }

  y2 = drawSectionHeader(ctx2, '05', '中科院生物考研初试备考作战时间轴', y2);
  const timeline = [
    '• 3月 - 6月（基础夯实）：通读朱圣庚《生物化学》、丁明孝《细胞生物学》或《陈阅增普通生物学》主干框架，完成第一轮知识图谱笔记。',
    '• 7月 - 9月（强化专题）：精做国科大历年 612/852/338/888 真题，重点攻克代谢网络、信号转导与分子实验设计题型；9月核对目标所最新招生目录。',
    '• 10月 - 11月（定校锁卷）：对照统考竞争数据正式确认网报单位或联培方案；梳理目标方向公开文献脉络。',
    '• 12月（冲刺模考）：严格按 3 小时考试节奏完成全真模拟演练，提升名词解释、简答实验设计与英文综述输出效率。',
  ].join('\n');

  drawWrappedText(ctx2, timeline, MARGIN_X, y2, CONTENT_W, 34, '400 19px "Noto Sans SC", sans-serif', '#1E293B');

  drawFooter(ctx2, 2, 2, plan);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [PAGE_W, PAGE_H],
    compress: true,
  });

  pdf.addImage(page1.canvas.toDataURL('image/png'), 'PNG', 0, 0, PAGE_W, PAGE_H);
  pdf.addPage([PAGE_W, PAGE_H], 'portrait');
  pdf.addImage(page2.canvas.toDataURL('image/png'), 'PNG', 0, 0, PAGE_W, PAGE_H);

  pdf.save('中科院生物考研作战白皮书.pdf');
}

/**
 * 触发本地考纲摘要文件下载
 */
export function downloadSubjectSyllabusText(resource: SubjectPrepResource): void {
  const content = [
    resource.syllabusTitle,
    '====================================================',
    `科目代码：${resource.subjectCode}    科目名称：${resource.subjectName}`,
    `官方大纲参考入口：${resource.officialSyllabusUrl}`,
    '',
    '【核心考点提纲】',
    ...resource.syllabusSummary,
    '',
    '【官方考纲原文参考书目】',
    ...(resource.textbooks.length > 0
      ? resource.textbooks.map((t) => `- ${t.title} | ${t.author} | ${t.publisher} (${t.edition})`)
      : [`- ${resource.syllabusRefNote || '官方考纲原文未单列具体书名'}`]),
    '',
    '【推荐同步视频课程】',
    ...resource.videoCourses.map((v) => `- [${v.platform}] ${v.title} (${v.url})`),
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `国科大_${resource.subjectCode}_${resource.subjectName}_考试大纲精要.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
