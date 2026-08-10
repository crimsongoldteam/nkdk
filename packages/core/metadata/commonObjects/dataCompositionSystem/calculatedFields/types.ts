import { defineMetadataItemCollectionRule } from "../../../ruleRuntime"
import type { CalculatedField, CalculatedFieldYAML } from "../calculatedField/types"
import { CalculatedFieldRules } from "../calculatedField/rules"

export type CalculatedFields = CalculatedField[]
export type CalculatedFieldsYAML = CalculatedFieldYAML[]

export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
  propertyType: "CalculatedFields",
  itemRule: CalculatedFieldRules,
  xmlElement: "CalculatedField",
  yamlAsArray: true,
  keyField: "dataPath",
  configurationIndexAddressing: "yamlPath",
})
