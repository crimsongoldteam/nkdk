import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import "~/metadata/systemEnumerations/fromXML"
import "~/metadata/systemEnumerations/fromYAML"
import "~/metadata/systemEnumerations/toYAML"
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
  fromXML: importCalculatedFieldOrderExpressionFromXML,
  toXML: exportCalculatedFieldOrderExpressionToXML,
})
