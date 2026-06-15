import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { exportSystemEnumerationToYAMLDeprecated } from "~/metadata/systemEnumerations/toYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { exportBooleanToYAML } from "../boolean/toYAML"
import { formatMetadataTargetToYAML } from "../metadataTargets"
import { Font, FontFullYAML, FontRef, FontYAML } from "./types"

export const exportFontToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  font: Font | undefined
): FontYAML | undefined => {
  if (!font) return undefined

  const ref = font.rawRef === true ? undefined : convertRefToYAML(_context, font.ref, font.kind)
  const result: FontFullYAML = {}

  if (font.rawRef === true && font.ref !== undefined) {
    result.Вид = SE.FontTypeToYAML[font.kind]
    result.Значение = font.ref
  } else if (ref !== undefined) {
    result.Вид = ref
  } else if (font.ref !== undefined) {
    result.Вид = SE.FontTypeToYAML[font.kind]
    result.Значение = font.ref
  } else {
    result.ВидXML = font.kind
  }

  if (font.faceName !== undefined) result.Имя = font.faceName
  if (font.height !== undefined) result.Размер = font.height
  if (font.scale !== undefined) result.Масштаб = font.scale

  const italicValue = exportBooleanToYAML(_context, undefined, font.italic)
  if (italicValue !== undefined) result.Наклонный = italicValue

  const underlineValue = exportBooleanToYAML(_context, undefined, font.underline)
  if (underlineValue !== undefined) result.Подчеркивание = underlineValue

  const boldValue = exportBooleanToYAML(_context, undefined, font.bold)
  if (boldValue !== undefined) result.Полужирный = boldValue

  const strikeoutValue = exportBooleanToYAML(_context, undefined, font.strikeout)
  if (strikeoutValue !== undefined) result.Зачеркивание = strikeoutValue

  return result
}

const convertRefToYAML = (
  context: ConfigurationContext,
  ref: FontRef | undefined,
  kind: SE.FontType
): string | undefined => {
  if (ref === undefined) return undefined

  if (kind === "StyleItem") {
    return (
      exportSystemEnumerationToYAMLDeprecated(context, { type: "SystemEnumeration", typeSE: "StyleFonts" }, ref) ??
      tryFormatProjectStyleRefToYAML(ref)
    )
  }

  return exportSystemEnumerationToYAMLDeprecated(context, { type: "SystemEnumeration", typeSE: "WindowsFonts" }, ref)
}

function tryFormatProjectStyleRefToYAML(ref: string): string | undefined {
  try {
    return formatMetadataTargetToYAML({
      canonical: `StyleItem.${ref}`,
      constraint: { kind: "styleItem", styleItemTypes: ["Font"] },
    })
  } catch (caught) {
    if (caught instanceof Error && caught.message === "Некорректный формат цели метаданных") return undefined
    throw caught
  }
}

registerTypeRule("Font", "exportToYAML", exportFontToYAML)
