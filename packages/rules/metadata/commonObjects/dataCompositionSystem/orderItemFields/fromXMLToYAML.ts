import { isXmlElementNode, xmlAttributeValue, xmlElementChildren, withConfigurationIndexYamlCollectionItemContext } from "@nkdk/runtime"
import { importMetadataItemFromXMLToYAML } from "../../../ruleRuntime/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import { OrderItemFieldRules } from "./rules"

export const importOrderItemFieldsFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  traversal,
}) => {
  const source = isXmlElementNode(xml)
    ? xml.name === "dcsset:item" ? xml : xmlElementChildren(xml, "dcsset:item")
    : asRecord(xml)?.["dcsset:item"] ?? xml
  const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
  const result = items.flatMap<unknown>((value, index) => {
    const item = isXmlElementNode(value) ? value : asRecord(value)
    if (item === undefined) return []
    const xsiType = isXmlElementNode(item) ? xmlAttributeValue(item, "xsi:type") : item["_xsi:type"]
    if (xsiType === "dcsset:OrderItemAuto") return ["[Авто]"]
    if (xsiType !== undefined && xsiType !== "dcsset:OrderItemField") return []

    const yaml = importMetadataItemFromXMLToYAML({
      context: withConfigurationIndexYamlCollectionItemContext(context, { index, yamlAsArray: true }),
      rule: OrderItemFieldRules,
      xml: item,
      traversal: {
        ...traversal,
        pathCursor: traversal.pathCursor.child(index),
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
