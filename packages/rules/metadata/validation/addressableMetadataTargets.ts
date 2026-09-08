import { parseMetadataTargetFromModel } from "../ruleRuntime/metadataTarget"
import type { ParsedMetadataTarget } from "../ruleRuntime/metadataTarget/types"
import type { MetadataItemRule, PropertyRule } from "../ruleRuntime/property/types"
import { projectObjectIndexKey, type ProjectObjectIndexEntry } from "./projectReferenceIndex"
import { traverseMetadataRuleYaml } from "./metadataRuleYamlTraversal"
import type { ProjectLogicalAddressEntry } from "../projectDefinition/componentIndexFacts"
import type { XmlAnomalyAnnotations } from "@nkdk/runtime"

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
  readonly annotations?: XmlAnomalyAnnotations
  readonly rule: MetadataItemRule
  readonly canonicalTarget: string
  readonly filePath: string
}): ProjectObjectIndexEntry[] {
  const entries: ProjectObjectIndexEntry[] = []
  traverseMetadataRuleYaml({
    yaml: params.yaml,
    annotations: params.annotations,
    rule: params.rule,
    initialState: params.canonicalTarget,
    enterCollectionItem: ({ yaml, rule, itemName, state: boundaryTarget }) => {
      const externalMetadata = rule.externalMetadata
      if (externalMetadata?.placement !== "ownedEntry" || itemName === undefined) return boundaryTarget
      const target = `${boundaryTarget}.${externalMetadata.segment}.${itemName}`
      entries.push(addressableMetadataObjectEntry({ canonical: target, filePath: params.filePath, ...objectIndexDetails(yaml) }))
      return target
    },
  })
  return entries
}

export function addressableMetadataObjectEntry(params: {
  readonly canonical: string
  readonly filePath: string
  readonly type?: string
}): ProjectObjectIndexEntry {
  const parsed = parseMetadataTargetFromModel({ canonical: params.canonical, constraint: { kind: "object", allowNested: true } })
  if (!parsed.ok || parsed.target.kind !== "object") throw new Error(`Некорректный адресуемый metadata target: ${params.canonical}`)
  return {
    canonical: projectObjectIndexKey(parsed.target), target: parsed.target,
    result: { ok: true, filePath: params.filePath, details: params.type === undefined ? {} : { type: params.type } },
  }
}

export function collectAddressableMetadataLogicalAddresses(params: {
  readonly yaml: unknown
  readonly annotations?: XmlAnomalyAnnotations
  readonly rule: MetadataItemRule
  readonly logicalAddress: string
  readonly filePath: string
}): ProjectLogicalAddressEntry[] {
  const entries: ProjectLogicalAddressEntry[] = []
  traverseMetadataRuleYaml({
    yaml: params.yaml,
    annotations: params.annotations,
    rule: params.rule,
    initialState: params.logicalAddress,
    enterCollectionItem: ({ rule, propertyRule, collectionUidSegment, itemName, state: boundaryTarget }) => {
      const logicalAddress = addressableMetadataItemLogicalAddress({
        rule, propertyRule, collectionUidSegment, itemName, parent: boundaryTarget,
      })
      if (logicalAddress === undefined) return boundaryTarget
      entries.push({ logicalAddress, sourceProjectPath: params.filePath })
      return logicalAddress
    },
  })
  return entries
}

export function addressableMetadataItemLogicalAddress(params: {
  readonly rule: MetadataItemRule
  readonly propertyRule: PropertyRule
  readonly collectionUidSegment?: string
  readonly itemName?: string
  readonly parent: string
}): string | undefined {
  const segment = addressableMetadataItemSegment(params)
  return segment === undefined ? undefined : `${params.parent}.${segment}`
}

export function addressableMetadataItemSegment(params: {
  readonly rule: MetadataItemRule
  readonly propertyRule: PropertyRule
  readonly collectionUidSegment?: string
  readonly itemName?: string
}): string | undefined {
  const external = params.rule.externalMetadata
  const addressable = external?.placement === "ownedEntry" || external?.placement === "ownerChild"
  const segment = params.propertyRule.configurationIndexUidSegment ?? params.collectionUidSegment ?? external?.segment
  if ((!addressable && params.rule.properties.uuid === undefined) || params.itemName === undefined || segment === undefined) return undefined
  return `${segment}.${params.itemName}`
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
