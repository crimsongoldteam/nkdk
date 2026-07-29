import { relative, resolve, sep } from "node:path"
import { TopLevelMetadataItemRuleSources } from "../appliedObjects/configuration/topLevelRules"
import type { MetadataItemRule } from "../orchestration/property/types"
import { runtimeRuleOrderModules } from "./catalogImports.generated"
import type { RuleOrderSource, RuntimeRuleOrderCatalog } from "./types"

interface ExportedRule {
  rule: MetadataItemRule
  filePath: string
  exportName: string
}

export async function buildRuntimeRuleOrderCatalog(params: {
  metadataDir: string
}): Promise<RuntimeRuleOrderCatalog> {
  const root = resolve(params.metadataDir)
  const exportedRules: ExportedRule[] = []
  for (const module of runtimeRuleOrderModules) {
    const filePath = resolve(root, module.metadataRelativePath)
    const exports = module.exports as Record<string, unknown>
    for (const exportName of Object.keys(exports).sort(bytewiseCompare)) {
      const value = exports[exportName]
      if (!isMetadataItemRule(value)) continue
      exportedRules.push({ rule: value, filePath, exportName })
    }
  }

  const sources = new WeakMap<MetadataItemRule, RuleOrderSource>()
  const sourcesByCandidate = new Map<string, RuleOrderSource>()
  const directExports = new WeakSet<MetadataItemRule>()
  const ambiguities: { candidate: string; reason: string }[] = []
  for (const exported of exportedRules) {
    registerSource({
      sources,
      sourcesByCandidate,
      ambiguities,
      rule: exported.rule,
      source: sourceFor(root, exported, []),
    })
    directExports.add(exported.rule)
  }
  for (const relation of TopLevelMetadataItemRuleSources) {
    const source = sources.get(relation.sourceRule)
    if (source === undefined) {
      ambiguities.push({
        candidate: relation.sourceRule.itemType,
        reason: "Не найден статический source для top-level runtime-правила",
      })
      continue
    }
    registerSource({ sources, sourcesByCandidate, ambiguities, rule: relation.rule, source })
  }
  for (const exported of exportedRules) {
    indexNestedRules({
      root,
      exported,
      rule: exported.rule,
      propertyPath: [],
      sources,
      sourcesByCandidate,
      directExports,
      ambiguities,
      ancestors: new Set(),
    })
  }

  return {
    sourceOf: (rule) => sources.get(rule),
    sources: () => [...sourcesByCandidate.values()].sort((left, right) => bytewiseCompare(left.candidate, right.candidate)),
    ambiguities: () => [...ambiguities].sort((left, right) => bytewiseCompare(left.candidate, right.candidate)),
  }
}

function indexNestedRules(params: {
  root: string
  exported: ExportedRule
  rule: MetadataItemRule
  propertyPath: readonly string[]
  sources: WeakMap<MetadataItemRule, RuleOrderSource>
  sourcesByCandidate: Map<string, RuleOrderSource>
  directExports: WeakSet<MetadataItemRule>
  ambiguities: { candidate: string; reason: string }[]
  ancestors: ReadonlySet<MetadataItemRule>
}): void {
  if (params.ancestors.has(params.rule)) return
  const ancestors = new Set(params.ancestors)
  ancestors.add(params.rule)
  for (const nested of staticNestedRules(params.rule)) {
    const propertyPath = [...params.propertyPath, ...nested.propertyPath]
    if (!params.directExports.has(nested.rule)) {
      registerSource({
        sources: params.sources,
        sourcesByCandidate: params.sourcesByCandidate,
        ambiguities: params.ambiguities,
        rule: nested.rule,
        source: sourceFor(params.root, params.exported, propertyPath),
      })
    }
    indexNestedRules({ ...params, rule: nested.rule, propertyPath, ancestors })
  }
}

function staticNestedRules(
  rule: MetadataItemRule
): readonly { rule: MetadataItemRule; propertyPath: readonly string[] }[] {
  const result: { rule: MetadataItemRule; propertyPath: readonly string[] }[] = []
  for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
    const itemRule = propertyRule.itemRule
    if (isMetadataItemRule(itemRule)) {
      result.push({ rule: itemRule, propertyPath: ["properties", propertyKey, "itemRule"] })
    }
  }
  for (const [index, collection] of (rule.childCollections ?? []).entries()) {
    if (isMetadataItemRule(collection.itemRule)) {
      result.push({
        rule: collection.itemRule,
        propertyPath: ["childCollections", String(index), "itemRule"],
      })
    }
  }
  return result
}

function registerSource(params: {
  sources: WeakMap<MetadataItemRule, RuleOrderSource>
  sourcesByCandidate: Map<string, RuleOrderSource>
  ambiguities: { candidate: string; reason: string }[]
  rule: MetadataItemRule
  source: RuleOrderSource
}): void {
  const existing = params.sources.get(params.rule)
  if (existing !== undefined) {
    if (sameSource(existing, params.source)) return
    const priority = compareSourcePriority(params.source, existing)
    if (priority > 0) return
    params.sourcesByCandidate.delete(existing.candidate)
  }

  const candidateSource = params.sourcesByCandidate.get(params.source.candidate)
  if (candidateSource === undefined) {
    params.sourcesByCandidate.set(params.source.candidate, params.source)
  } else if (!sameSource(candidateSource, params.source)) {
    params.sourcesByCandidate.delete(params.source.candidate)
    params.ambiguities.push({
      candidate: params.source.candidate,
      reason: "Один candidate связан с различающимися source",
    })
  }
  params.sources.set(params.rule, params.source)
}

function sameSource(left: RuleOrderSource, right: RuleOrderSource): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function compareSourcePriority(left: RuleOrderSource, right: RuleOrderSource): number {
  const pathLength = left.propertyPath.length - right.propertyPath.length
  return pathLength === 0 ? bytewiseCompare(left.candidate, right.candidate) : pathLength
}

function sourceFor(
  root: string,
  exported: ExportedRule,
  propertyPath: readonly string[]
): RuleOrderSource {
  const topLevelCandidate = `${relative(root, exported.filePath).split(sep).join("/")}#${exported.exportName}`
  const candidate = propertyPath.length === 0 ? topLevelCandidate : `${topLevelCandidate}.${propertyPath.join(".")}`
  return {
    candidate,
    filePath: exported.filePath,
    exportName: exported.exportName,
    propertyPath,
    declarationOrder: Object.keys(exportedRuleAtPath(exported.rule, propertyPath).properties),
  }
}

function exportedRuleAtPath(rule: MetadataItemRule, propertyPath: readonly string[]): MetadataItemRule {
  let current: unknown = rule
  for (const segment of propertyPath) {
    if (current === null || typeof current !== "object") throw new Error(`Некорректный путь правила: ${propertyPath}`)
    current = (current as Record<string, unknown>)[segment]
  }
  if (!isMetadataItemRule(current)) throw new Error(`Путь не указывает на MetadataItemRule: ${propertyPath}`)
  return current
}

function isMetadataItemRule(value: unknown): value is MetadataItemRule {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const candidate = value as Partial<MetadataItemRule>
  return (
    typeof candidate.itemType === "string" &&
    candidate.properties !== null &&
    typeof candidate.properties === "object" &&
    !Array.isArray(candidate.properties)
  )
}

function bytewiseCompare(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}
