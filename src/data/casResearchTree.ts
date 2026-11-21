/**
 * @file casResearchTree.ts
 * @description 三级级联生物学方向探索树（12大研究领域 × 86研究方向 × 371细分小方向）
 * 全量基于 3,089 名中科院生物导师公开研究方向与 62 所 241 条官方统考招生目录构建，
 * 按真实学科广度均衡分配 2/3 级选择自由度，完整覆盖全部 62 所院系所与 241 条专业招生方向。
 */

import { BiologyDomainNode } from '../types/cas';
import { DOMAINS_A } from './casResearchTreeDomainsA';
import { DOMAINS_B1 } from './casResearchTreeDomainsB1';
import { DOMAINS_B2 } from './casResearchTreeDomainsB2';
import { DOMAINS_C1 } from './casResearchTreeDomainsC1';
import { DOMAINS_C2 } from './casResearchTreeDomainsC2';

export const RESEARCH_EXPLORATION_TREE: BiologyDomainNode[] = [
  ...DOMAINS_A,
  ...DOMAINS_B1,
  ...DOMAINS_B2,
  ...DOMAINS_C1,
  ...DOMAINS_C2,
];
