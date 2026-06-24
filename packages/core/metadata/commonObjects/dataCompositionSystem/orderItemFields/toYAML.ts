import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToYAMLFunction } from "~/metadata/orchestration"
import { exportPropertiesToYAML } from "~/metadata/orchestration/property/toYAML"
import { OrderItemFieldRules } from "./rules"
import type { OrderItemFields, OrderItemFieldsYAML } from "./types"

const exportOrderItemToYAML = (
  context: ConfigurationContext,
  item: OrderItemFields[number]
): OrderItemFieldsYAML[number] | undefined => {
  if (item.itemType === "OrderItemAuto") return "[Авто]"

  return exportPropertiesToYAML({
    context,
    data: item,
    rule: OrderItemFieldRules,
  })
}

export const exportOrderItemFieldsToYAML: ExportToYAMLFunction = (
  context,
  _rule,
  value: OrderItemFields | undefined
): OrderItemFieldsYAML | undefined => {
  if (!value || value.length === 0) return undefined

  const result = value.flatMap((item) => {
    const yaml = exportOrderItemToYAML(context, item)
    return yaml ? [yaml] : []
  })

  return result.length > 0 ? result : undefined
}
