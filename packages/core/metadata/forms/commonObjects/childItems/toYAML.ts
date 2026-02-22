import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"
import { ToTypedYAML, ToYAML } from "~/metadata/metadataFactory/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { mockContext } from "~/tests/mockContext"
import { PropertyRule } from "../../elements/calendarField/rules"
import { AllChildItem, TypedElement } from "./types"

export const exportChildItemsToTypedYAML = <From extends TypedElement>(
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From[] | undefined
): Record<string, ToTypedYAML<From>> | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Record<string, ToTypedYAML<From>> = {}
  for (const item of data) {
    const value = exportElementToTypedYAML({
      context: mockContext,
      element: item,
    })!

    result[item.name] = value
  }

  return result
}

export const exportChildItemsToPartialYAML = <From extends AllChildItem>(
  _context: ConfigurationContext,
  // _rule: PropertyRule<any>,
  data: From[] | undefined
): Record<string, ToYAML<From>> | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Record<string, ToYAML<From>> = {}
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

registerTypeRule("ChildItems", "exportToYAML", exportChildItemsToTypedYAML)
