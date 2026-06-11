import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToYAMLDeprecated } from "../../systemEnumerations/toYAML"
import * as SE from "../../systemEnumerations/types"
import { Color, isRawColorRef } from "./types"

export const exportColorToYAML = <T extends Color | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  color: T
): string | undefined => {
  if (!color) return undefined

  if (isRawColorRef(color)) return color.rawRef

  if (color.type === "StyleItem") {
    const standardColor = exportSystemEnumerationToYAMLDeprecated<SE.StyleColors>(
      context,
      { type: "SystemEnumeration", typeSE: "StyleColors" },
      color.value
    )
    if (standardColor) {
      return standardColor
    }
    // Для custom style colors возвращаем с префиксом "ЭлементСтиля."
    return `ЭлементСтиля.${color.value}`
  }

  if (color.type === "WindowsColor") {
    return exportSystemEnumerationToYAMLDeprecated<SE.WindowsColors>(
      context,
      { type: "SystemEnumeration", typeSE: "WindowsColors" },
      color.value
    )
  }

  if (color.type === "WebColor") {
    return exportSystemEnumerationToYAMLDeprecated<SE.WebColors>(
      context,
      { type: "SystemEnumeration", typeSE: "WebColors" },
      color.value
    )
  }

  return color.value
}

registerTypeRule("Color", "exportToYAML", exportColorToYAML)
