import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "../../../ruleRuntime"
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

registerMetadataItemRule({
  propertyType: "DataCompositionSchemaDataSetField",
  itemRule: DataCompositionSchemaDataSetFieldRules,
})

registerMetadataItemCollectionRule({
  propertyType: "DataSetFieldFields",
  itemRule: DataCompositionSchemaDataSetFieldRules,
  xmlElement: "Field",
  yamlAsArray: true,
  configurationIndexAddressing: "yamlPath",
})
