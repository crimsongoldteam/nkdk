import { ConfigurationContext } from "@nkdk/runtime"
import { ToEnterprise } from "../../../ruleRuntime"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { exportElementToEnterprise } from "../../../ruleRuntime/formElement/toEnterprise"
import { ChildItem } from "./types"

export const exportChildItemsToEnterprise = <From extends ChildItem>(params: {
  context: ConfigurationContext
  value: From[] | undefined
}): ToEnterprise<From["itemType"]>[] | undefined => {
  const { context, value: items } = params

  if (!items || items.length === 0) return []

  const result = [] as ToEnterprise<From["itemType"]>[]
  for (const item of items) {
    const resultItem = exportElementToEnterprise({ context, value: item })
    result.push(resultItem)
  }
  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("GroupChildItems", "exportToEnterprise", exportChildItemsToEnterprise)
export const metadataPropertyRule001 = definePropertyTypeRule("CommandBarChildItems", "exportToEnterprise", exportChildItemsToEnterprise)
export const metadataPropertyRule002 = definePropertyTypeRule("TableChildItems", "exportToEnterprise", exportChildItemsToEnterprise)
export const metadataPropertyRule003 = definePropertyTypeRule("PagesChildItems", "exportToEnterprise", exportChildItemsToEnterprise)
