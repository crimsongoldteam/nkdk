import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { Color, ColorTypeToPrefix, ColorXML } from "./types"

export const exportColorToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  color: Color | undefined
): ColorXML | undefined => {
  if (!color) return undefined

  const prefix = ColorTypeToPrefix[color.type as keyof typeof ColorTypeToPrefix]
  if (prefix) {
    return `${prefix}:${color.value}`
  }

  return color.value
}

registerTypeRule("Color", "exportToXML", exportColorToXML)
