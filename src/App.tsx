/**
 * @file App.tsx
 * @description 中国科学院生物考研智能百宝箱主应用外壳
 * 统一管理左侧导航状态、跨模块考情联动跳转、三级方向探索完成解锁门禁与个人白皮书目标状态。
 * 全量数据与核心算法均通过服务端 /api/* 接口按需获取，不在前端源码中嵌入。
 */

import { useEffect, useState } from 'react';
import { SidebarNav } from './components/SidebarNav';
import { Module1Panorama } from './components/Module1Panorama';
import { Module2Bidirectional } from './components/Module2Bidirectional';
import { Module3RiskDashboard } from './components/Module3RiskDashboard';
import { Module4AIAdvisorHub } from './components/Module4AIAdvisorHub';
import { Module5Whitepaper } from './components/Module5Whitepaper';
import {
  AdmissionDirection,
  CasAdvisor,
  CasInstitute,
  NavModule,
  UserTargetPlan,
} from './types/cas';

const STORAGE_KEY = 'cas_bio_toolbox_target_plan_v3';

const DEFAULT_TARGET_PLAN: UserTargetPlan = {
  candidateName: '中科院生物追梦人',
  targetYear: 2027,
  instituteId: 'hias',
  directionId: 'dir-hias-086001',
  targetTeamName: '',
  advisorId: '',
  directionQuizCompleted: false,
  customGoalScore: 350,
  selectedSubjectCodes: ['338', '888'],
};

export default function App() {
  const [activeModule, setActiveModule] = useState<NavModule>(NavModule.PANORAMA);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 跨模块跳转上下文状态
  const [module2InstituteJump, setModule2InstituteJump] = useState<string | 'ALL'>('ALL');
  const [module3SearchJump, setModule3SearchJump] = useState<string>('');
  const [aiInsightSummary, setAiInsightSummary] = useState<string>('');

  // 考生个人备考目标（支持 localStorage 持久化）
  const [targetPlan, setTargetPlan] = useState<UserTargetPlan>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = { ...DEFAULT_TARGET_PLAN, ...JSON.parse(saved) } as UserTargetPlan;
        if (parsed.instituteId && parsed.directionId) {
          return parsed;
        }
      }
    } catch {
      // 忽略本地存储读取异常
    }
    return DEFAULT_TARGET_PLAN;
  });

  const [targetInstitute, setTargetInstitute] = useState<CasInstitute | undefined>(undefined);
  const [targetDirection, setTargetDirection] = useState<AdmissionDirection | undefined>(undefined);
  const [targetAdvisor, setTargetAdvisor] = useState<CasAdvisor | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(targetPlan));
    } catch {
      // 忽略写入异常
    }
  }, [targetPlan]);

  // 通过服务端接口解析当前已锁定的目标院所、方向及导师
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/app/resolve-target', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instituteId: targetPlan.instituteId,
        directionId: targetPlan.directionId,
        advisorId: targetPlan.advisorId,
      }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('resolve failed'))))
      .then((data: { institute: CasInstitute; direction: AdmissionDirection; advisor: CasAdvisor | null }) => {
        setTargetInstitute(data.institute);
        setTargetDirection(data.direction);
        setTargetAdvisor(data.advisor ?? null);
        // 若本地缓存了已废弃或失效 ID（如旧版缓存），自动同步为服务端规范后的目标 ID
        if (
          data.direction?.id &&
          (data.direction.id !== targetPlan.directionId || data.institute.id !== targetPlan.instituteId)
        ) {
          setTargetPlan((prev) => ({
            ...prev,
            instituteId: data.institute.id,
            directionId: data.direction.id,
          }));
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          // 保持当前展示状态
        }
      });

    return () => controller.abort();
  }, [targetPlan.instituteId, targetPlan.directionId, targetPlan.advisorId]);

  const handleJumpToInstituteDirections = (instituteId: string) => {
    setModule2InstituteJump(instituteId);
    setActiveModule(NavModule.BIDIRECTIONAL);
  };

  const handleJumpToRiskDashboard = (instituteKeyword: string) => {
    setModule3SearchJump(instituteKeyword);
    setActiveModule(NavModule.RISK_DASHBOARD);
  };

  const handleSelectDirectionAsTarget = (dir: AdmissionDirection) => {
    const codes = [dir.subjects.subject3Code, dir.subjects.subject4Code].filter(
      (c) => c && c !== '无'
    );
    setTargetPlan((prev) => ({
      ...prev,
      instituteId: dir.instituteId,
      directionId: dir.id,
      selectedSubjectCodes: codes,
    }));
  };

  const handleCompleteDirectionQuiz = (summary: string) => {
    setAiInsightSummary(summary);
    setTargetPlan((prev) => ({
      ...prev,
      directionQuizCompleted: true,
    }));
  };

  const handleLockTeamTarget = (payload: {
    instituteId?: string;
    instituteName: string;
    majorCode: string;
    directionName: string;
  }) => {
    const teamTag = `${payload.instituteName.replace('中国科学院', '')} · ${payload.majorCode} ${payload.directionName}`;
    setTargetPlan((prev) => ({
      ...prev,
      targetTeamName: teamTag,
    }));

    fetch('/api/app/resolve-target', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lockPayload: payload,
        advisorId: targetPlan.advisorId,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { institute: CasInstitute; direction: AdmissionDirection; advisor: CasAdvisor | null } | null) => {
        if (!data?.direction) return;
        const codes = [
          data.direction.subjects.subject3Code,
          data.direction.subjects.subject4Code,
        ].filter((c) => c && c !== '无');
        setTargetInstitute(data.institute);
        setTargetDirection(data.direction);
        setTargetPlan((prev) => ({
          ...prev,
          instituteId: data.direction.instituteId,
          directionId: data.direction.id,
          selectedSubjectCodes: codes,
          targetTeamName: teamTag,
        }));
      })
      .catch(() => {
        // 已更新 targetTeamName，忽略网络抖动
      });
  };

  const handleLockAdvisor = (advisor: CasAdvisor) => {
    setTargetPlan((prev) => ({
      ...prev,
      advisorId: prev.advisorId === advisor.id ? '' : advisor.id,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F6F9] text-slate-900">
      <SidebarNav
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        targetPlan={targetPlan}
        targetInstitute={targetInstitute}
        targetDirection={targetDirection}
        targetAdvisor={targetAdvisor}
        mobileOpen={mobileMenuOpen}
        onToggleMobile={setMobileMenuOpen}
      />

      <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1280px]">
          {activeModule === NavModule.PANORAMA && (
            <Module1Panorama
              onJumpToInstituteDirections={handleJumpToInstituteDirections}
              onJumpToRiskDashboard={handleJumpToRiskDashboard}
            />
          )}

          {activeModule === NavModule.BIDIRECTIONAL && (
            <Module2Bidirectional
              initialInstituteFilter={module2InstituteJump}
              activeTargetDirectionId={targetPlan.directionId}
              onSelectAsTarget={handleSelectDirectionAsTarget}
            />
          )}

          {activeModule === NavModule.RISK_DASHBOARD && (
            <Module3RiskDashboard initialSearchKeyword={module3SearchJump} />
          )}

          {activeModule === NavModule.AI_ADVISOR && (
            <Module4AIAdvisorHub
              directionQuizCompleted={targetPlan.directionQuizCompleted}
              lockedTeamName={targetPlan.targetTeamName}
              lockedAdvisorId={targetPlan.advisorId}
              onCompleteDirectionQuiz={handleCompleteDirectionQuiz}
              onLockTeamTarget={handleLockTeamTarget}
              onLockAdvisor={handleLockAdvisor}
              onSaveAiSummaryForWhitepaper={setAiInsightSummary}
            />
          )}

          {activeModule === NavModule.WHITEPAPER && (
            <Module5Whitepaper
              targetPlan={targetPlan}
              onUpdatePlan={setTargetPlan}
              aiInsightSummary={aiInsightSummary}
            />
          )}
        </div>
      </main>
    </div>
  );
}
