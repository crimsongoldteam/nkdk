export interface RuleOrderObservation {
  configuration: string
  sourceXmlPath: string
  logicalAddress: string
  xmlNodeLogicalAddress: string
  ruleId: string
  ruleCandidates: readonly string[]
  itemType: string
  fields: readonly string[]
}

export type RawRuleOrderObservation = Omit<RuleOrderObservation, "ruleCandidates">

export interface RuleOrderCatalog {
  candidates(ruleId: string): readonly string[]
  match(observation: RawRuleOrderObservation): RuleOrderObservation | undefined
  ambiguities(): readonly { ruleId: string; candidates: readonly string[] }[]
}
