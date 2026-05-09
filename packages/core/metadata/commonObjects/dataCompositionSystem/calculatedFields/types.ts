import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import type { CalculatedField, CalculatedFieldYAML } from "../calculatedField/types"
import { CalculatedFieldRules } from "../calculatedField/rules"

export type CalculatedFields = CalculatedField[]
export type CalculatedFieldsYAML = CalculatedFieldYAML[]

registerMetadataItemCollectionRule({
  propertyType: "CalculatedFields",
  itemRule: CalculatedFieldRules,
  xmlElement: "CalculatedField",
  yamlAsArray: true,
})
