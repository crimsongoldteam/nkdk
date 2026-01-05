import { Context } from "../../context/types"
import { Color, ColorPrefixToType, ColorXML } from "./types"

export const importColorFromXML = (_context: Context, xml: ColorXML | undefined): Color | undefined => {
  if (!xml) return undefined

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
