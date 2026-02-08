import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"
import { mockContext } from "~/tests/mockContext"
import { PropertyRule } from "../../elements/calendarField/rules"
import { AllChildItem, TypedElement } from "./types"

export const exportChildItemsToTypedYAML = <From extends TypedElement>(
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From[] | undefined
): Record<string, ToTypedEnterpriseType<From>> | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Record<string, ToTypedEnterpriseType<From>> = {}
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
  _rule: PropertyRule<any>,
  data: From[] | undefined
): Record<string, ToPartialEnterpriseType<From>> | undefined => {
  if (!data || data.length === 0) return undefined

  const result: Record<string, ToPartialEnterpriseType<From>> = {}
  for (const item of data) {
    const value = exportElementToPartialYAML({
      context: mockContext,
      element: item,
    })!

    result[item.name] = value
  }

  return result
}

registerTypeRule("ChildItems", "exportToEnterprise", exportChildItemsToTypedYAML)
