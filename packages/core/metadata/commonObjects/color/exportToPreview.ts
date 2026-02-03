import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { Color, ColorPreview } from "./types"

export const exportColorToPreview = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  color: Color | undefined
): ColorPreview | undefined => {
  if (!color) return undefined

  if (color.type === "WebColor" && color.value.startsWith("#")) {
    const hex = color.value.slice(1)
    const red = parseInt(hex.slice(0, 2), 16)
    const green = parseInt(hex.slice(2, 4), 16)
    const blue = parseInt(hex.slice(4, 6), 16)
    return { Type: "AbsoluteColor", Red: red, Green: green, Blue: blue }
  }

  const prefix =
    color.type === "WebColor" ? "WebColors" : color.type === "WindowsColor" ? "WindowsColors" : "StyleItems"

  return {
    Type: "Color",
    Value: `${prefix}.${color.value}`,
  }
}
