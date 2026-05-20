import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementToPartialYAML, exportElementToTypedYAML, ToTypedYAML, ToYAML } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { mockContext } from "~/tests/mockContext"
import { PropertyRule } from "../../elements/calendarField/rules"
import { exportChildItemsToTreeYAMLProperty } from "./treeYAML"
import { ChildItem, TypedElement } from "./types"

export const exportChildItemsToTypedYAML = <From extends TypedElement>(
  _context: ConfigurationContext,
  _rule: PropertyRule,
  data: From[] | undefined
): Record<string, ToTypedYAML<From["itemType"]>> | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Record<string, ToTypedYAML<From["itemType"]>> = {}
  for (const item of data) {
    const value = exportElementToTypedYAML({
      context: mockContext,
      element: item,
    })!

    result[item.name] = value
  }

  return result
}

export const exportChildItemsToPartialYAML = <From extends ChildItem>(
  _context: ConfigurationContext,
  data: From[] | undefined
): Record<string, ToYAML<From["itemType"]>> | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Record<string, ToYAML<From["itemType"]>> = {}
  for (const item of data) {
    const value = exportElementToPartialYAML({
      context: mockContext,
      element: item,
    })!

    if (value === undefined) continue

    result[item.name] = value
  }

  return result
}

registerTypeRule("TableChildItems", "exportToYAML", exportChildItemsToTreeYAMLProperty)
registerTypeRule("GroupChildItems", "exportToYAML", exportChildItemsToTreeYAMLProperty)
registerTypeRule("CommandBarChildItems", "exportToYAML", exportChildItemsToTreeYAMLProperty)
registerTypeRule("PagesChildItems", "exportToYAML", exportChildItemsToTreeYAMLProperty)
