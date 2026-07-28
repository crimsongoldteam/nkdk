import { readdir } from "node:fs/promises"
import { relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"
import type { MetadataItemRule } from "../orchestration/property/types"
import { fingerprintMetadataItemRule } from "./fingerprint"
import type { RuleOrderCatalog } from "./types"

export async function buildRuleOrderCatalog(params: { metadataDir: string }): Promise<RuleOrderCatalog> {
  const root = resolve(params.metadataDir)
  const candidatesByRuleId = new Map<string, string[]>()
  const candidatesByItemType = new Map<string, string[]>()
  for (const filePath of await findRuleFiles(root)) {
    const exports = (await import(pathToFileURL(filePath).href)) as Record<string, unknown>
    for (const exportName of Object.keys(exports).sort(bytewiseCompare)) {
      const value = exports[exportName]
      if (!isMetadataItemRule(value)) continue
      const ruleId = fingerprintMetadataItemRule(value)
      const candidate = `${relative(root, filePath).split(sep).join("/")}#${exportName}`
      const candidates = candidatesByRuleId.get(ruleId) ?? []
      candidates.push(candidate)
      candidatesByRuleId.set(ruleId, candidates)
      const itemCandidates = candidatesByItemType.get(value.itemType) ?? []
      itemCandidates.push(candidate)
      candidatesByItemType.set(value.itemType, itemCandidates)
    }
  }
  for (const candidates of candidatesByRuleId.values()) candidates.sort(bytewiseCompare)
  for (const [itemType, candidates] of candidatesByItemType) {
    candidatesByItemType.set(itemType, [...new Set(candidates)].sort(bytewiseCompare))
  }
  return {
    candidates: (ruleId) => candidatesByRuleId.get(ruleId) ?? [],
    match(observation) {
      const candidates = candidatesByRuleId.get(observation.ruleId) ?? candidatesByItemType.get(observation.itemType)
      return candidates === undefined ? undefined : { ...observation, ruleCandidates: candidates }
    },
    ambiguities: () =>
      [...candidatesByRuleId]
        .filter(([, candidates]) => candidates.length > 1)
        .sort(([left], [right]) => bytewiseCompare(left, right))
        .map(([ruleId, candidates]) => ({ ruleId, candidates })),
  }
}

async function findRuleFiles(directory: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((left, right) =>
    bytewiseCompare(left.name, right.name)
  )) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) result.push(...(await findRuleFiles(path)))
    else if (entry.isFile() && entry.name === "rules.ts") result.push(path)
  }
  return result
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
