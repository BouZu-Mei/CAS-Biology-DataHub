/**
 * @file casResearchTreeBuilder.ts
 * @description 三级级联生物学方向知识树构建器（L1 生物学研究领域 → L2 研究方向 → L3 细分小方向）
 */

import {
  BiologyDomainNode,
  ResearchDirectionNode,
  SubSpecialtyNode,
} from '../types/cas';

export type CompactSubSpecTuple = [
  id: string,
  name: string,
  summary: string,
  majorCodes: string[],
  keywords: string[],
  keyMethods: string[],
  instituteIds?: string[],
  majorPrefixes?: string[],
];

export interface CompactDirectionSpec {
  id: string;
  name: string;
  summary: string;
  subs: CompactSubSpecTuple[];
}

export interface CompactDomainSpec {
  id: string;
  name: string;
  badge: string;
  subtitle: string;
  directions: CompactDirectionSpec[];
}

export function buildDomainNode(spec: CompactDomainSpec): BiologyDomainNode {
  const directions: ResearchDirectionNode[] = spec.directions.map((dir) => {
    const subSpecialties: SubSpecialtyNode[] = dir.subs.map(
      ([subId, name, summary, majorCodes, keywords, keyMethods, instituteIds, majorPrefixes]) => ({
        id: subId,
        name,
        summary,
        keyMethods,
        matchRules: {
          majorCodes,
          ...(majorPrefixes && majorPrefixes.length > 0 ? { majorPrefixes } : {}),
          keywords,
          ...(instituteIds && instituteIds.length > 0 ? { instituteIds } : {}),
        },
      })
    );

    return {
      id: dir.id,
      name: dir.name,
      summary: dir.summary,
      subSpecialties,
    };
  });

  return {
    id: spec.id,
    name: spec.name,
    badge: spec.badge,
    subtitle: spec.subtitle,
    directions,
  };
}
