import { defineMetadataItemCollectionRule, defineMetadataItemRule } from "../../../ruleRuntime"
import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
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

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "DataCompositionSchemaDataSetField",
  itemRule: DataCompositionSchemaDataSetFieldRules,
})

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "DataSetFieldFields",
  itemRule: DataCompositionSchemaDataSetFieldRules,
  xmlElement: "Field",
  yamlAsArray: true,
  configurationIndexAddressing: "yamlPath",
})
