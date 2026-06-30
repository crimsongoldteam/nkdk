import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataDocumentJournalRules } from "./rules"

export type MetadataDocumentJournal = MetadataTypeByRule<typeof MetadataDocumentJournalRules>
export type MetadataDocumentJournalYAML = YAMLTypeByRule<typeof MetadataDocumentJournalRules>

registerMetadataItemRule({
  propertyType: "MetadataDocumentJournal",
  itemRule: MetadataDocumentJournalRules,
})

export interface MetadataDocumentJournalColumnsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataDocumentJournalColumns"
}

export type MetadataDocumentJournalColumnsRuleParams = Omit<MetadataDocumentJournalColumnsWidePropertyRule, "type">

export function metadataDocumentJournalColumnsRule<const Params extends MetadataDocumentJournalColumnsRuleParams>(
  params: WideExactRuleParams<MetadataDocumentJournalColumnsRuleParams, Params>
): Readonly<{ type: "MetadataDocumentJournalColumns" } & Params> {
  return defineWidePropertyRule("MetadataDocumentJournalColumns", params)
}
