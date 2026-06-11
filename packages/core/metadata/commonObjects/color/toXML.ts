import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { Color, ColorTypeToPrefix, ColorXML, isRawColorRef } from "./types"

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

registerTypeRule("Color", "exportToXML", exportColorToXML)
