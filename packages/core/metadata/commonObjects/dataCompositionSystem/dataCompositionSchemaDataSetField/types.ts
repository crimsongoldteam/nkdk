import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import "../calculatedFieldUseRestriction/types"
import { DataCompositionSchemaDataSetFieldRules } from "./rules"

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
