/**
 * @file App.tsx
 * @description 中国科学院生物考研智能百宝箱主应用外壳
 * 统一管理左侧导航状态、跨模块考情联动跳转、三级方向探索完成解锁门禁与个人白皮书目标状态。
 */

import { useEffect, useMemo, useState } from 'react';
import { SidebarNav } from './components/SidebarNav';
import { Module1Panorama } from './components/Module1Panorama';
import { Module2Bidirectional } from './components/Module2Bidirectional';
import { Module3RiskDashboard } from './components/Module3RiskDashboard';
import { Module4AIAdvisorHub } from './components/Module4AIAdvisorHub';
import { Module5Whitepaper } from './components/Module5Whitepaper';
import { CAS_ADVISORS } from './data/casAdvisors';
import { CAS_INSTITUTES } from './data/casInstitutes';
import { ADMISSION_DIRECTIONS } from './data/casSubjectsAndAdmissions';
import { AdmissionDirection, CasAdvisor, NavModule, UserTargetPlan } from './types/cas';

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
        const validInst = CAS_INSTITUTES.some((i) => i.id === parsed.instituteId);
        const validDir = ADMISSION_DIRECTIONS.find((d) => d.id === parsed.directionId);
        if (validInst && validDir) {
          return parsed;
        }
      }
    } catch {
      // 忽略本地存储读取异常
    }
    return DEFAULT_TARGET_PLAN;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(targetPlan));
    } catch {
      // 忽略写入异常
    }
  }, [targetPlan]);

  const targetInstitute = useMemo(
    () => CAS_INSTITUTES.find((i) => i.id === targetPlan.instituteId),
    [targetPlan.instituteId]
  );

  const targetDirection = useMemo(
    () => ADMISSION_DIRECTIONS.find((d) => d.id === targetPlan.directionId),
    [targetPlan.directionId]
  );

  const targetAdvisor = useMemo(
    () => (targetPlan.advisorId ? CAS_ADVISORS.find((a) => a.id === targetPlan.advisorId) ?? null : null),
    [targetPlan.advisorId]
  );

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
    const matchedDir =
      ADMISSION_DIRECTIONS.find(
        (d) =>
          (payload.instituteId ? d.instituteId === payload.instituteId : d.instituteName.includes(payload.instituteName)) &&
          d.majorCode === payload.majorCode
      ) ??
      ADMISSION_DIRECTIONS.find((d) =>
        payload.instituteId ? d.instituteId === payload.instituteId : d.instituteName.includes(payload.instituteName)
      );

    setTargetPlan((prev) => ({
      ...prev,
      instituteId: matchedDir?.instituteId ?? payload.instituteId ?? prev.instituteId,
      directionId: matchedDir?.id ?? prev.directionId,
      selectedSubjectCodes: matchedDir
        ? [matchedDir.subjects.subject3Code, matchedDir.subjects.subject4Code].filter((c) => c && c !== '无')
        : prev.selectedSubjectCodes,
      targetTeamName: `${payload.instituteName.replace('中国科学院', '')} · ${payload.majorCode} ${payload.directionName}`,
    }));
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
