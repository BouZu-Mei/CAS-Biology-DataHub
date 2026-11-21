/**
 * @file SidebarNav.tsx
 * @description Windows Metro × The Lancet 左侧边栏导航组件
 * 提供五大核心模块切换、移动端抽屉菜单以及当前考生锁定目标概览磁贴。
 */

import React from 'react';
import {
  Building2,
  ArrowLeftRight,
  BarChart3,
  BrainCircuit,
  FileText,
  Target,
  Menu,
  X,
} from 'lucide-react';
import { CasAdvisor, CasInstitute, AdmissionDirection, NavModule, UserTargetPlan } from '../types/cas';

interface SidebarNavProps {
  activeModule: NavModule;
  onSelectModule: (module: NavModule) => void;
  targetPlan: UserTargetPlan;
  targetInstitute?: CasInstitute;
  targetDirection?: AdmissionDirection;
  targetAdvisor?: CasAdvisor | null;
  mobileOpen: boolean;
  onToggleMobile: (open: boolean) => void;
}

export const SIDEBAR_NAV_ITEMS: {
  id: NavModule;
  index: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: NavModule.PANORAMA,
    index: '01',
    title: '院所全景档案',
    icon: Building2,
  },
  {
    id: NavModule.BIDIRECTIONAL,
    index: '02',
    title: '初试双向检索',
    icon: ArrowLeftRight,
  },
  {
    id: NavModule.RISK_DASHBOARD,
    index: '03',
    title: '分数线看板',
    icon: BarChart3,
  },
  {
    id: NavModule.AI_ADVISOR,
    index: '04',
    title: '方向与导师库',
    icon: BrainCircuit,
  },
  {
    id: NavModule.WHITEPAPER,
    index: '05',
    title: '考纲备考白皮书',
    subtitle: '官方考纲书目 · 导出PDF',
    icon: FileText,
  },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeModule,
  onSelectModule,
  targetPlan,
  targetInstitute,
  targetDirection,
  targetAdvisor,
  mobileOpen,
  onToggleMobile,
}) => {
  const handleSelect = (id: NavModule) => {
    onSelectModule(id);
    onToggleMobile(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#002B54] text-white select-none">
      {/* 品牌识别区：Lancet Deep Navy Metro 磁贴头 */}
      <div className="border-b border-white/10 px-5 py-6">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono tracking-wider text-sky-200/80">
            UCAS BIOLOGY · DATA HUB
          </div>
          <button
            type="button"
            onClick={() => onToggleMobile(false)}
            aria-label="关闭导航菜单"
            className="lg:hidden p-1.5 text-slate-300 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <h1 className="mt-2 text-lg font-bold leading-snug tracking-tight text-white">
          中国科学院生物考研
          <span className="block text-sky-300">智能百宝箱</span>
        </h1>
      </div>

      {/* 导航菜单列表 */}
      <nav aria-label="主功能导航" className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`metro-tile group flex w-full ${
                item.subtitle ? 'items-start' : 'items-center'
              } gap-3 px-3.5 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-[#00407A] text-white outline-1 outline-sky-300/40'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center ${
                  item.subtitle ? 'mt-0.5 ' : ''
                }${
                  isActive
                    ? 'bg-[#AD1E24] text-white'
                    : 'bg-white/10 text-sky-200 group-hover:bg-white/15'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-sky-300/90 tabular-nums">
                    {item.index}
                  </span>
                  <span className="truncate text-sm font-semibold">{item.title}</span>
                </div>
                {item.subtitle && (
                  <p className="mt-0.5 truncate text-xs text-slate-300/80">{item.subtitle}</p>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* 底部个人作战目标摘要磁贴 */}
      <div className="border-t border-white/10 bg-[#001F3F] p-4">
        <div className="flex items-center text-xs text-sky-200">
          <span className="flex items-center gap-1.5 font-medium">
            <Target className="h-3.5 w-3.5 text-sky-300" />
            <span>已锁定备考方向</span>
          </span>
        </div>

        <div className="mt-2.5 space-y-1 text-xs">
          <div className="truncate font-semibold text-white">
            {targetInstitute?.shortName || '未选定院所'}
            {targetDirection ? ` · ${targetDirection.majorCode}` : ''}
          </div>
          <div className="truncate text-slate-300">
            科目：{targetPlan.selectedSubjectCodes.join(' + ') || '待选择'}
          </div>
          <div className="truncate text-slate-300">
            方向：
            {targetPlan.targetTeamName
              ? targetPlan.targetTeamName
              : targetPlan.directionQuizCompleted
              ? '已探索（可选定方向）'
              : '待三级探索解锁'}
          </div>
          {targetAdvisor && (
            <div className="truncate text-sky-200">
              查阅导师：{targetAdvisor.name}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleSelect(NavModule.WHITEPAPER)}
          className="metro-tile mt-3 w-full bg-[#006B77] px-3 py-2 text-center text-xs font-semibold text-white hover:bg-[#005862]"
        >
          查看 / 导出个人作战白皮书
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 移动端顶部紧凑导航条 */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-[#002B54] px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onToggleMobile(true)}
            aria-label="打开功能导航"
            className="p-1.5 bg-white/10 text-white hover:bg-white/20"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="truncate text-sm font-bold">中国科学院生物考研智能百宝箱</span>
        </div>
        <button
          type="button"
          onClick={() => handleSelect(NavModule.WHITEPAPER)}
          className="shrink-0 whitespace-nowrap bg-[#AD1E24] px-2.5 py-1.5 text-xs font-semibold text-white"
        >
          白皮书PDF
        </button>
      </div>

      {/* 桌面端固定左侧边栏 (272px) */}
      <aside className="hidden lg:block lg:w-[272px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
        {sidebarContent}
      </aside>

      {/* 移动端抽屉遮罩 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={() => onToggleMobile(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[280px] max-w-[85vw] h-full shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
