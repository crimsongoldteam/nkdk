import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { Color, ColorPrefixToType, ColorXML, isRawColorRefValue } from "./types"

export const importColorFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: ColorXML | undefined
): Color | undefined => {
  if (!xml || xml === "auto") return undefined

  if (isRawColorRefValue(xml)) return { rawRef: xml }

  const match = xml.match(/^(\w+):(.+)$/)
  if (match) {
    const [, prefix, value] = match
    const type = ColorPrefixToType[prefix]
    return {
      type,
      value,
    }
  }

  return {
    type: "Absolute",
    value: xml,
  }
}

registerTypeRule("Color", "importFromXML", importColorFromXML)
