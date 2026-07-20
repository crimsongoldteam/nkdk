import { registerMetadataItemCollectionRule } from "../../../orchestration"
import { MetadataTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import "../../../systemEnumerations/fromXML"
import "../../../systemEnumerations/fromYAML"
import "../../../systemEnumerations/toYAML"
import { importCalculatedFieldOrderExpressionFromXML } from "./fromXML"
import { CalculatedFieldOrderExpressionRules } from "./rules"
import { exportCalculatedFieldOrderExpressionToXML } from "./toXML"

export type CalculatedFieldOrderExpressionItem = MetadataTypeByRule<typeof CalculatedFieldOrderExpressionRules>
export type CalculatedFieldOrderExpressionItemYAML = YAMLTypeByRule<typeof CalculatedFieldOrderExpressionRules>

export type CalculatedFieldOrderExpression = CalculatedFieldOrderExpressionItem[]
export type CalculatedFieldOrderExpressionYAML = CalculatedFieldOrderExpressionItemYAML[]

registerMetadataItemCollectionRule({
  propertyType: "CalculatedFieldOrderExpression",
  itemRule: CalculatedFieldOrderExpressionRules,
  xmlElement: "dcssch:orderExpression",
  yamlAsArray: true,
  configurationIndexAddressing: "yamlPath",
  fromXML: importCalculatedFieldOrderExpressionFromXML,
  toXML: exportCalculatedFieldOrderExpressionToXML,
})
