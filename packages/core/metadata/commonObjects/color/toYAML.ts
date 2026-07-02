import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToYAMLDeprecated } from "../../systemEnumerations/toYAML"
import * as SE from "../../systemEnumerations/types"
import { formatMetadataTargetToYAML } from "../metadataTargets"
import { colorStyleItemTarget, isRawColorRef, type Color } from "./types"

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
    return formatMetadataTargetToYAML({
      canonical: `StyleItem.${color.value}`,
      constraint: colorStyleItemTarget,
    })
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
