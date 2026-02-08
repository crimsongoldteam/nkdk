import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import {
  exportSystemEnumerationToEnterprise,
  exportSystemEnumerationToYAML,
} from "../../systemEnumerations/exportToEnterprise"
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
    return exportSystemEnumerationToEnterprise(context, undefined, color.value, SE.WindowsColorsToEnterprise)
  }

  if (color.type === "WebColor") {
    return exportSystemEnumerationToEnterprise(context, undefined, color.value, SE.WebColorsToEnterprise)
  }

  return color.value
}

registerTypeRule("Color", "exportToEnterprise", exportColorToEnterprise)
