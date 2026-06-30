import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import "../appearanceFields/types"
import "../availableValues/types"
import "../calculatedFieldUseRestriction/types"
import "./kind"
import { DataCompositionSchemaDataSetFieldRules } from "./rules"
export type { DataCompositionSchemaDataSetFieldKind } from "./kind"

export type DataCompositionSchemaDataSetField = MetadataTypeByRule<typeof DataCompositionSchemaDataSetFieldRules>
export type DataCompositionSchemaDataSetFieldYAML = YAMLTypeByRule<typeof DataCompositionSchemaDataSetFieldRules>

export type DataSetFieldFields = DataCompositionSchemaDataSetField[]
export type DataSetFieldFieldsYAML = DataCompositionSchemaDataSetFieldYAML[]

registerMetadataItemRule({
  propertyType: "DataCompositionSchemaDataSetField",
  itemRule: DataCompositionSchemaDataSetFieldRules,
})

registerMetadataItemCollectionRule({
  propertyType: "DataSetFieldFields",
  itemRule: DataCompositionSchemaDataSetFieldRules,
  xmlElement: "Field",
  yamlAsArray: true,
})

export interface DataCompositionSchemaDataSetFieldKindWidePropertyRule extends WidePropertyRuleBase {
  type: "DataCompositionSchemaDataSetFieldKind"
}

export type DataCompositionSchemaDataSetFieldKindRuleParams = Omit<
  DataCompositionSchemaDataSetFieldKindWidePropertyRule,
  "type"
>

export function dataCompositionSchemaDataSetFieldKindRule<
  const Params extends DataCompositionSchemaDataSetFieldKindRuleParams,
>(
  params: WideExactRuleParams<DataCompositionSchemaDataSetFieldKindRuleParams, Params>
): Readonly<{ type: "DataCompositionSchemaDataSetFieldKind" } & Params> {
  return defineWidePropertyRule("DataCompositionSchemaDataSetFieldKind", params)
}
