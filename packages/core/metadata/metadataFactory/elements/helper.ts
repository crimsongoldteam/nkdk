import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement as MetadataItem } from "~/metadata/forms/elements/baseElement/types"
import { getValueOrDefault } from "../properties/helpers"
import { PropertyRule } from "../properties/types"
import { ElementRule } from "./types"

const isEmptyValue = (v: unknown): boolean =>
  (Array.isArray(v) && v.length === 0) ||
  (v !== null && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0)

const isValueEqualToDefault = (value: unknown, valueOrDefault: unknown): boolean =>
  Object.is(value, valueOrDefault) ||
  (isEmptyValue(value) && (valueOrDefault === undefined || isEmptyValue(valueOrDefault)))

export const isEmptyMetadataItem = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: ElementRule
  element: T | undefined
}): boolean => {
  const { context, rule, element } = params
  if (element === undefined) return true

  for (const [key, propertyRule] of Object.entries(rule.properties) as [string, PropertyRule][]) {
    if (key === "itemType") continue

    const value = element[key as keyof T]
    if (value === undefined) continue

    const valueOrDefault = getValueOrDefault({
      context,
      rule: propertyRule,
      value: undefined,
      name: key,
      operation: "importFromXML",
    })

    if (isValueEqualToDefault(value, valueOrDefault)) continue

    return false
  }

  if (rule.events && "events" in element && typeof element.events === "object" && element.events !== null) {
    if (Object.keys(element.events).length > 0) return false
  }

  return true
}
