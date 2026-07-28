import type { MetadataItemRule } from "../orchestration/property/types"

export interface RuleOrderSource {
  candidate: string
  filePath: string
  exportName: string
  propertyPath: readonly string[]
  declarationOrder: readonly string[]
  numericOrder: Readonly<Record<string, number>>
}

export interface RuleOrderObservation {
  configuration: string
  sourceXmlPath: string
  logicalAddress: string
  xmlNodeLogicalAddress: string
  ruleId: string
  source: RuleOrderSource
  itemType: string
  fields: readonly string[]
}

export type RawRuleOrderObservation = RuleOrderObservation

export interface RuntimeRuleOrderCatalog {
  sourceOf(rule: MetadataItemRule): RuleOrderSource | undefined
  ambiguities(): readonly { candidate: string; reason: string }[]
}
