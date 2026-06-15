import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { importSystemEnumerationFromYAMLDeprecated } from "~/metadata/systemEnumerations/fromYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { importBooleanFromYAML } from "../boolean/fromYAML"
import { parseMetadataTargetFromYAML } from "../metadataTargets"
import { Font, FontFullYAML, FontYAML, isRawPrefixedFontRef } from "./types"

export const importFontFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: FontYAML | undefined
): Font | undefined => {
  if (yaml === undefined) return undefined
  if (yaml === null || typeof yaml !== "object" || Array.isArray(yaml)) {
    throw new Error("Font: ожидался объект YAML")
  }

  const fullData = yaml as FontFullYAML
  const result: Partial<Font> = {}

  if (fullData.Вид !== undefined && fullData.Значение !== undefined) {
    const kind = SE.FontTypeFromYAML[fullData.Вид as SE.FontTypeYAML]
    if (kind !== undefined) {
      result.kind = kind
      result.ref = fullData.Значение
      result.rawRef = true
    }
  }

  if (result.kind === undefined && fullData.Вид !== undefined) {
    const importedRef = importRefFromYAML(context, fullData.Вид)
    if (importedRef) {
      result.ref = importedRef.ref
      result.kind = importedRef.kind
    }
  }

  if (result.kind === undefined) {
    result.kind = fullData.ВидXML ?? "Absolute"
  }

  if (fullData.Имя !== undefined) result.faceName = fullData.Имя
  if (fullData.Размер !== undefined) result.height = fullData.Размер
  if (fullData.Полужирный !== undefined) result.bold = importBooleanFromYAML(context, undefined, fullData.Полужирный)
  if (fullData.Наклонный !== undefined) result.italic = importBooleanFromYAML(context, undefined, fullData.Наклонный)
  if (fullData.Подчеркивание !== undefined)
    result.underline = importBooleanFromYAML(context, undefined, fullData.Подчеркивание)
  if (fullData.Зачеркивание !== undefined)
    result.strikeout = importBooleanFromYAML(context, undefined, fullData.Зачеркивание)
  if (fullData.Масштаб !== undefined) result.scale = fullData.Масштаб

  return result as Font
}

const importRefFromYAML = (context: ConfigurationContext, value: string): Pick<Font, "ref" | "kind"> | undefined => {
  const projectStyleRef = parseProjectStyleRefFromYAML(value)
  if (projectStyleRef) return { ref: projectStyleRef, kind: "StyleItem" }

  const styleFontRef = importSystemEnumerationFromYAMLDeprecated<SE.StyleFonts>(
    context,
    { type: "SystemEnumeration", typeSE: "StyleFonts" },
    value
  )
  if (styleFontRef) {
    return {
      ref: styleFontRef,
      kind: "StyleItem",
    }
  }

  const windowsFontRef = importSystemEnumerationFromYAMLDeprecated<SE.WindowsFonts>(
    context,
    { type: "SystemEnumeration", typeSE: "WindowsFonts" },
    value
  )
  if (windowsFontRef) {
    return {
      ref: windowsFontRef,
      kind: "WindowsFont",
    }
  }

  return undefined
}

function parseProjectStyleRefFromYAML(value: string): string | undefined {
  if (!value.includes(".") && !isRawPrefixedFontRef(value)) return undefined

  const parsed = parseMetadataTargetFromYAML({
    value,
    constraint: { kind: "styleItem", styleItemTypes: ["Font"] },
  })
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.target.kind === "styleItem" ? parsed.target.name : undefined
}

registerTypeRule("Font", "importFromYAML", importFontFromYAML)
