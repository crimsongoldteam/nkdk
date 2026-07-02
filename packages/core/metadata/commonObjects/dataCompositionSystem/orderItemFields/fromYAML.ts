import { ConfigurationContext } from "../../../context/types"
import { importMetadataItemFromYAML } from "../../../orchestration/metadataItem/fromYAML"
import type { PropertyRule } from "../../../orchestration/property/types"
import { OrderItemFieldRules } from "./rules"
import type { OrderItemFields, OrderItemFieldsYAML } from "./types"

const importOrderItemFromYAML = (
  context: ConfigurationContext,
  yaml: OrderItemFieldsYAML[number]
): OrderItemFields[number] | undefined => {
  if (yaml === "[Авто]") return { itemType: "OrderItemAuto" }
  if (yaml == null || typeof yaml !== "object" || Array.isArray(yaml)) return undefined

  return importMetadataItemFromYAML({
    context,
    rule: OrderItemFieldRules,
    yaml,
  })
}

export const importOrderItemFieldsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  yaml: OrderItemFieldsYAML | undefined
): OrderItemFields | undefined => {
  if (yaml == undefined || yaml.length === 0) return undefined

  const result = yaml.flatMap((item) => {
    const imported = importOrderItemFromYAML(context, item)
    return imported ? [imported] : []
  })

  return result.length > 0 ? result : undefined
}
