import { withConfigurationIndexYamlCollectionItemContext } from "../../../configurationIndex/collector/context"
import { importMetadataItemFromXMLToYAML } from "../../../orchestration/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "../../../orchestration/property/importYamlTypes"
import { CalculatedFieldOrderExpressionRules } from "./rules"

export const importCalculatedFieldOrderExpressionFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  traversal,
}) => {
  const source = asRecord(xml)?.["dcssch:orderExpression"] ?? xml
  const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
  const result = items.flatMap((item, index) => {
    const yaml = importMetadataItemFromXMLToYAML({
      context: withConfigurationIndexYamlCollectionItemContext(context, { index, yamlAsArray: true }),
      rule: CalculatedFieldOrderExpressionRules,
      xml: item,
      traversal: {
        ...traversal,
        yamlPath: [...traversal.yamlPath, index],
      },
    })
    return yaml === undefined ? [] : [yaml]
  })

  return result.length === 0 ? undefined : result
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
