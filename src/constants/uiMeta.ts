/**
 * @file uiMeta.ts
 * @description 前端纯展示样式与筛选选项常量（不含任何业务数据与算法）
 */

import { InstituteDifficultyTier, RegionZone } from '../types/cas';

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
    badgeBg: string;
    badgeText: string;
    rank: number;
  }
> = {
  Extreme: {
    tier: 'Extreme',
    badgeBg: 'bg-[#AD1E24]',
    badgeText: 'text-white',
    rank: 5,
  },
  Ultra: {
    tier: 'Ultra',
    badgeBg: 'bg-[#B45309]',
    badgeText: 'text-white',
    rank: 4,
  },
  ProMax: {
    tier: 'ProMax',
    badgeBg: 'bg-[#00407A]',
    badgeText: 'text-white',
    rank: 3,
  },
  Pro: {
    tier: 'Pro',
    badgeBg: 'bg-[#006B77]',
    badgeText: 'text-white',
    rank: 2,
  },
  Plus: {
    tier: 'Plus',
    badgeBg: 'bg-slate-600',
    badgeText: 'text-white',
    rank: 1,
  },
};

export const REGION_OPTIONS: RegionZone[] = [
  RegionZone.BEIJING,
  RegionZone.SHANGHAI,
  RegionZone.GUANGSHEN,
  RegionZone.EAST_CENTRAL,
  RegionZone.WEST_NORTHEAST,
];
