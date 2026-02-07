import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { AllChildItem } from "./types"

export const exportTypedChildItemsToEnterprise = <From extends AllChildItem>(
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  data: From[] | undefined
): Record<string, ToTypedEnterpriseType<From>> | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Record<string, ToTypedEnterpriseType<From>> = {}
  for (const item of data) {
    const fn = getOperationFunction("ExportTypedToEnterprise", item.elementType)
    if (fn == undefined)
      throw new Error(`ExportTypedToEnterprise function not found for element type: ${item.elementType}`)
    const resultItem = fn(context, rule, item)
    result[item.name] = resultItem as ToTypedEnterpriseType<From>
  }

  return result
}

export const exportPartialChildItemsToEnterprise = <From extends AllChildItem>(
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  data: From[] | undefined
): Record<string, ToPartialEnterpriseType<From>> | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Record<string, ToPartialEnterpriseType<From>> = {}
  for (const item of data) {
    const fn = getOperationFunction("ExportPartialToEnterprise", item.elementType)
    if (fn == undefined)
      throw new Error(`ExportPartialToEnterprise function not found for element type: ${item.elementType}`)
    const resultItem = fn(context, rule, item)
    result[item.name] = resultItem as ToPartialEnterpriseType<From>
  }

  return result
}

registerTypeRule("ChildItems", "exportToEnterprise", exportTypedChildItemsToEnterprise)
registerTypeRule("ChildItems", "exportToEnterprise", exportPartialChildItemsToEnterprise)
