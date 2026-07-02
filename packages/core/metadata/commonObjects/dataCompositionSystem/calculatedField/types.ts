import { registerMetadataItemRule } from "../../../orchestration"
import { MetadataTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import "../availableValues/types"
import "../calculatedFieldOrderExpression/types"
import "../calculatedFieldUseRestriction/types"
import { CalculatedFieldRules } from "./rules"

export type CalculatedField = MetadataTypeByRule<typeof CalculatedFieldRules>
export type CalculatedFieldYAML = YAMLTypeByRule<typeof CalculatedFieldRules>

registerMetadataItemRule({ propertyType: "CalculatedField", itemRule: CalculatedFieldRules })
