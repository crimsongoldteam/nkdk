import { registerMetadataItemCollectionRule } from "../../../orchestration"
import { MetadataTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import "../../../systemEnumerations/fromXML"
import "../../../systemEnumerations/fromYAML"
import "../../../systemEnumerations/toYAML"
import { importCalculatedFieldOrderExpressionFromXMLToYAML } from "./fromXMLToYAML"
import { CalculatedFieldOrderExpressionRules } from "./rules"

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
  fromXMLToYAML: importCalculatedFieldOrderExpressionFromXMLToYAML,
})
