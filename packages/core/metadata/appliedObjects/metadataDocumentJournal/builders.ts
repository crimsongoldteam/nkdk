import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface MetadataDocumentJournalColumnsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataDocumentJournalColumns"
}

export type MetadataDocumentJournalColumnsRuleParams = Omit<MetadataDocumentJournalColumnsWidePropertyRule, "type">

export function metadataDocumentJournalColumnsRule<const Params extends MetadataDocumentJournalColumnsRuleParams>(
  params: WideExactRuleParams<MetadataDocumentJournalColumnsRuleParams, Params>
): Readonly<{ type: "MetadataDocumentJournalColumns" } & Params> {
  return defineWidePropertyRule("MetadataDocumentJournalColumns", params)
}
