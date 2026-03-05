import { ConfigurationContext } from "~/metadata/context/types"
import {
  exportElementToPartialYAML,
  exportElementToTypedYAML,
  MetadataItemTypeToTypedYAML,
  MetadataItemTypeToYAML,
} from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { mockContext } from "~/tests/mockContext"
import { PropertyRule } from "../../elements/calendarField/rules"
import { ChildItem, TypedElement } from "./types"

export const exportChildItemsToTypedYAML = <From extends TypedElement>(
  _context: ConfigurationContext,
  _rule: PropertyRule,
  data: From[] | undefined
): Record<string, MetadataItemTypeToTypedYAML<From["itemType"]>> | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Record<string, MetadataItemTypeToTypedYAML<From["itemType"]>> = {}
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
): Record<string, MetadataItemTypeToYAML<From["itemType"]>> | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Record<string, MetadataItemTypeToYAML<From["itemType"]>> = {}
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

registerTypeRule("TableChildItems", "exportToYAML", exportChildItemsToTypedYAML)
registerTypeRule("GroupChildItems", "exportToYAML", exportChildItemsToTypedYAML)
registerTypeRule("CommandBarChildItems", "exportToYAML", exportChildItemsToTypedYAML)
registerTypeRule("PagesChildItems", "exportToYAML", exportChildItemsToTypedYAML)
