import { withConfigurationIndexYamlCollectionItemContext } from "../../../configurationIndex/collector/context"
import { importMetadataItemFromXMLToYAML } from "../../../orchestration/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "../../../orchestration/property/importYamlTypes"
import { OrderItemFieldRules } from "./rules"

export const importOrderItemFieldsFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  traversal,
}) => {
  const source = asRecord(xml)?.["dcsset:item"] ?? xml
  const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
  const result = items.flatMap<unknown>((value, index) => {
    const item = asRecord(value)
    if (item === undefined) return []
    if (item["_xsi:type"] === "dcsset:OrderItemAuto") return ["[Авто]"]
    if (item["_xsi:type"] !== undefined && item["_xsi:type"] !== "dcsset:OrderItemField") return []

    const yaml = importMetadataItemFromXMLToYAML({
      context: withConfigurationIndexYamlCollectionItemContext(context, { index, yamlAsArray: true }),
      rule: OrderItemFieldRules,
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
