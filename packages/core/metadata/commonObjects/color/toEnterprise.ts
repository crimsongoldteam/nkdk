import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { Color, ColorEnterprise, isRawColorRef } from "./types"

export const exportColorToEnterprise = (params: { value: Color | undefined }): ColorEnterprise | undefined => {
  const { value } = params
  if (!value) return undefined

  if (isRawColorRef(value)) throw new Error("Color Enterprise: rawRef is XML-only")

  if (value.type === "WebColor" && value.value.startsWith("#")) {
    const hex = value.value.slice(1)
    const red = parseInt(hex.slice(0, 2), 16)
    const green = parseInt(hex.slice(2, 4), 16)
    const blue = parseInt(hex.slice(4, 6), 16)
    return { Type: "AbsoluteColor", Red: red, Green: green, Blue: blue }
  }

  const prefix =
    value.type === "WebColor" ? "WebColors" : value.type === "WindowsColor" ? "WindowsColors" : "StyleItems"

  return {
    Type: "Color",
    Value: `${prefix}.${value.value}`,
  }
}

registerTypeRule("Color", "exportToEnterprise", exportColorToEnterprise)
