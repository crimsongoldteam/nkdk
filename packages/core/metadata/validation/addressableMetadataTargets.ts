import { parseMetadataTargetFromModel } from "../ruleRuntime/metadataTarget"
import type { ParsedMetadataTarget } from "../ruleRuntime/metadataTarget/types"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { projectObjectIndexKey, type ProjectObjectIndexEntry } from "./projectReferenceIndex"
import { traverseMetadataRuleYaml } from "./metadataRuleYamlTraversal"

export function objectTargetForProjectFile(file: {
  readonly kind: "configuration" | "properties" | "form"
  readonly projectPath: string
  readonly metadataTarget?: { readonly canonical: string }
}): Extract<ParsedMetadataTarget, { kind: "object" }> | undefined {
  if (file.kind === "configuration") return undefined
  if (file.metadataTarget === undefined) {
    throw new Error(`Для адресуемого YAML-файла не передан metadata target: ${file.projectPath}`)
  }
  const parsed = parseMetadataTargetFromModel({
    canonical: file.metadataTarget.canonical,
    constraint: { kind: "object", allowNested: true },
  })
  if (!parsed.ok || parsed.target.kind !== "object") {
    throw new Error(`Некорректный topology metadata target для ${file.projectPath}: ${file.metadataTarget.canonical}`)
  }
  return parsed.target
}

export function collectAddressableMetadataObjectEntries(params: {
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly canonicalTarget: string
  readonly filePath: string
}): ProjectObjectIndexEntry[] {
  const entries: ProjectObjectIndexEntry[] = []
  traverseMetadataRuleYaml({
    yaml: params.yaml,
    rule: params.rule,
    initialState: params.canonicalTarget,
    enterCollectionItem: ({ yaml, rule, itemName, state: boundaryTarget }) => {
      const externalMetadata = rule.externalMetadata
      if (externalMetadata?.placement !== "ownedEntry" || itemName === undefined) return boundaryTarget
      const target = `${boundaryTarget}.${externalMetadata.segment}.${itemName}`
      const parsed = parseMetadataTargetFromModel({
        canonical: target,
        constraint: { kind: "object", allowNested: true },
      })
      if (!parsed.ok || parsed.target.kind !== "object") {
        throw new Error(`Некорректный адресуемый metadata target: ${target}`)
      }
      entries.push({
        canonical: projectObjectIndexKey(parsed.target),
        target: parsed.target,
        result: {
          ok: true,
          filePath: params.filePath,
          details: objectIndexDetails(yaml),
        },
      })
      return target
    },
  })
  return entries
}

function objectIndexDetails(value: unknown): { type?: string } {
  const type = asRecord(value)?.["Тип"]
  return typeof type === "string" ? { type } : {}
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
