import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { importSystemEnumerationFromYAMLDeprecated } from "../../systemEnumerations/fromYAML"
import * as SE from "../../systemEnumerations/types"
import { parseMetadataTargetFromYAML } from "../metadataTargets"
import { Color, ColorYAML, isRawColorRefValue } from "./types"

export const importColorFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ColorYAML | undefined
): Color | undefined => {
  if (!data) return undefined

  if (isRawColorRefValue(data)) {
    return { rawRef: data }
  }

  const projectStyleRef = parseProjectStyleRefFromYAML(data)
  if (projectStyleRef) {
    return {
      type: "StyleItem",
      value: projectStyleRef,
    }
  }

  // Проверяем, является ли это стандартным цветом из стиля
  const styleColor = importSystemEnumerationFromYAMLDeprecated<SE.StyleColors>(
    _context,
    { type: "SystemEnumeration", typeSE: "StyleColors" },
    data
  )
  if (styleColor) {
    return {
      type: "StyleItem",
      value: styleColor,
    }
  }

  // Проверяем, является ли это Windows цветом
  const windowsColor = importSystemEnumerationFromYAMLDeprecated<SE.WindowsColors>(
    _context,
    { type: "SystemEnumeration", typeSE: "WindowsColors" },
    data
  )
  if (windowsColor) {
    return {
      type: "WindowsColor",
      value: windowsColor,
    }
  }

  // Проверяем, является ли это Web цветом
  const webColor = importSystemEnumerationFromYAMLDeprecated<SE.WebColors>(
    _context,
    { type: "SystemEnumeration", typeSE: "WebColors" },
    data
  )
  if (webColor) {
    return {
      type: "WebColor",
      value: webColor,
    }
  }

  // Если не распознан, считаем абсолютным цветом
  return {
    type: "Absolute",
    value: data,
  }
}

function parseProjectStyleRefFromYAML(value: string): string | undefined {
  if (isRawPrefixedColorRef(value)) throw new Error(`Неизвестный корень "${value}"`)
  if (!value.startsWith("ЭлементСтиля.")) return undefined

  const parsed = parseMetadataTargetFromYAML({
    value,
    constraint: { kind: "styleItem", styleItemTypes: ["Color"] },
  })
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.target.kind === "styleItem" ? parsed.target.name : undefined
}

function isRawPrefixedColorRef(value: string): boolean {
  return value.startsWith("style:") || value.startsWith("win:") || value.startsWith("web:")
}

registerTypeRule("Color", "importFromYAML", importColorFromYAML)
