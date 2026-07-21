import { withConfigurationIndexYamlCollectionItemContext } from "../../../configurationIndex/collector/context"
import { importMetadataItemFromXMLToYAML } from "../../../orchestration/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "../../../orchestration/property/importYamlTypes"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"

export const importFilterItemFromXMLToYAML: ImportFromXMLToYAMLFunction = ({ context, xml, traversal }) => {
  const items = Array.isArray(xml) ? xml : xml === undefined ? [] : [xml]
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
