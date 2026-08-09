import { withConfigurationIndexYamlCollectionItemContext } from "../../../configurationIndex/collector/context"
import { importMetadataItemFromXMLToYAML } from "../../../ruleRuntime/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "../../../ruleRuntime/property/importYamlTypes"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"

export const importFilterItemFromXMLToYAML: ImportFromXMLToYAMLFunction = ({ context, xml, traversal }) => {
  const xmlRecord = asRecord(xml)
  const source = xmlRecord?.["_xsi:type"] === undefined ? (xmlRecord?.["dcsset:item"] ?? xml) : xml
  const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
  const result = items.flatMap((value, index) => {
    const item = asRecord(value)
    const itemRule =
      item?.["_xsi:type"] === "dcsset:FilterItemComparison"
        ? FilterItemComparisonRules
        : item?.["_xsi:type"] === "dcsset:FilterItemGroup"
          ? FilterItemGroupRules
          : undefined
    if (item === undefined || itemRule === undefined) return []

    const yaml = importMetadataItemFromXMLToYAML({
      context: withConfigurationIndexYamlCollectionItemContext(context, { index, yamlAsArray: true }),
      rule: itemRule,
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
