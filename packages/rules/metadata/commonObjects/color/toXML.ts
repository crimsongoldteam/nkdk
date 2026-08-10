import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import { ColorTypeToPrefix, isRawColorRef, type Color, type ColorXML } from "./types"

export const exportColorToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  color: Color | undefined
): ColorXML | undefined => {
  if (!color) return undefined

  if (isRawColorRef(color)) return color.rawRef

  const prefix = ColorTypeToPrefix[color.type as keyof typeof ColorTypeToPrefix]
  if (prefix) {
    return `${prefix}:${color.value}`
  }

  return color.value
}

export const metadataPropertyRule000 = definePropertyTypeRule("Color", "exportToXML", exportColorToXML)
