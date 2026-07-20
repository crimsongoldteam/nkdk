import { ConfigurationContextFromXML } from "../../../context/types"
import { withConfigurationIndexYamlCollectionItemContext } from "../../../configurationIndex/collector/context"
import { importMetadataItemFromXML } from "../../../orchestration/metadataItem/fromXML"
import type { PropertyRule } from "../../../orchestration/property/types"
import { OrderItemFieldRules } from "./rules"
import type { OrderItemFields } from "./types"

const importOrderItemFromXML = (
  context: ConfigurationContextFromXML,
  xml: unknown
): OrderItemFields[number] | undefined => {
  if (!xml || typeof xml !== "object") return undefined
  const xsiType = (xml as Record<string, unknown>)["_xsi:type"]

  if (xsiType === "dcsset:OrderItemAuto") return { itemType: "OrderItemAuto" }
  if (xsiType !== undefined && xsiType !== "dcsset:OrderItemField") return undefined

  return importMetadataItemFromXML({
    context,
    xml,
    rule: OrderItemFieldRules,
  })
}

export const importOrderItemFieldsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): OrderItemFields | undefined => {
  if (!xml) return undefined

  const source =
    xml && typeof xml === "object" && "dcsset:item" in (xml as Record<string, unknown>)
      ? (xml as Record<string, unknown>)["dcsset:item"]
      : xml
  const items = Array.isArray(source) ? source : [source]
  const result = items.flatMap((item, index) => {
    const itemContext = withConfigurationIndexYamlCollectionItemContext(context, { index, yamlAsArray: true })
    const imported = importOrderItemFromXML(itemContext, item)
    return imported ? [imported] : []
  })

  return result.length > 0 ? result : undefined
}
