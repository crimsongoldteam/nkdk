import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToYAML } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Color } from "./types"

export const exportColorToEnterprise = <T extends Color | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  color: T
): string | undefined => {
  if (!color) return undefined

  if (color.type === "StyleItem") {
    const standardColor = exportSystemEnumerationToYAML<SE.StyleColors>(
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
    return exportSystemEnumerationToYAML<SE.WindowsColors>(
      context,
      { type: "SystemEnumeration", typeSE: "WindowsColors" },
      color.value
    )
  }

  if (color.type === "WebColor") {
    return exportSystemEnumerationToYAML<SE.WebColors>(
      context,
      { type: "SystemEnumeration", typeSE: "WebColors" },
      color.value
    )
  }

  return color.value
}

registerTypeRule("Color", "exportToEnterprise", exportColorToEnterprise)
