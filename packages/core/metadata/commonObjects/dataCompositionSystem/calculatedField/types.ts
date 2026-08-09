import { registerMetadataItemRule } from "../../../ruleRuntime"
import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import "../availableValues/types"
import "../calculatedFieldOrderExpression/types"
import "../calculatedFieldUseRestriction/types"
import { CalculatedFieldRules } from "./rules"

export type CalculatedField = MetadataTypeByRule<typeof CalculatedFieldRules>
export type CalculatedFieldYAML = YAMLTypeByRule<typeof CalculatedFieldRules>

registerMetadataItemRule({ propertyType: "CalculatedField", itemRule: CalculatedFieldRules })
