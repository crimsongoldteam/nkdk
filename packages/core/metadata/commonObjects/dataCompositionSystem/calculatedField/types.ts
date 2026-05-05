import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import "../calculatedFieldOrderExpression/types"
import "../calculatedFieldUseRestriction/types"
import { CalculatedFieldRules } from "./rules"

export type CalculatedField = MetadataTypeByRule<typeof CalculatedFieldRules>
export type CalculatedFieldYAML = YAMLTypeByRule<typeof CalculatedFieldRules>

registerMetadataItemRule({ propertyType: "CalculatedField", itemRule: CalculatedFieldRules })
