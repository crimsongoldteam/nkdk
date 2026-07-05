import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "@sinclairtypebox"
import type { Static } from "@sinclairtypebox"
import * as SE from "../../systemEnumerations/types"
import { BooleanJSONSchema, StringboolYAML } from "../boolean/types"

export const PrefixedFontsFromXML = {
  "style:LargeTextFont": "LargeTextFont",
  "style:SmallTextFont": "SmallTextFont",
  "style:NormalTextFont": "NormalTextFont",
  "style:ExtraLargeTextFont": "ExtraLargeTextFont",
  "style:TextFont": "TextFont",
  "sys:ANSIFixedFont": "ANSIFixedFont",
  "sys:ANSIVariableFont": "ANSIVariableFont",
  "sys:OEMFixedFont": "OEMFixedFont",
  "sys:SystemFont": "SystemFont",
  "sys:DefaultGUIFont": "DefaultGUIFont",
} as const satisfies Record<string, SE.StyleFonts | SE.WindowsFonts>

export const PrefixedFontsToXML = Object.fromEntries(
  Object.entries(PrefixedFontsFromXML).map(([key, value]) => [value, key])
)

export type PrefixedFontsXML = keyof typeof PrefixedFontsFromXML
export type RawPrefixedFontRef = `style:${string}` | `sys:${string}`
export type RawFontRef = RawPrefixedFontRef | string
export type FontRef = SE.StyleFonts | SE.WindowsFonts | RawFontRef

export const isRawPrefixedFontRef = (value: unknown): value is RawPrefixedFontRef =>
  typeof value === "string" && (value.startsWith("style:") || value.startsWith("sys:"))

export interface FontXML {
  _ref?: PrefixedFontsXML | RawFontRef
  _faceName?: string
  _scale?: number
  _height?: number
  _bold?: boolean
  _italic?: boolean
  _underline?: boolean
  _strikeout?: boolean
  _kind: string
}

export interface Font {
  kind: SE.FontType
  ref?: FontRef
  rawRef?: boolean
  faceName?: string
  scale?: number
  height?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikeout?: boolean
}

export interface FontFullYAML {
  Вид?: SE.StyleFontsYAML | SE.WindowsFontsYAML | SE.FontTypeYAML | string
  ВидXML?: SE.FontType
  Значение?: string
  Имя?: string
  Масштаб?: number
  Размер?: number
  Наклонный?: StringboolYAML
  Подчеркивание?: StringboolYAML
  Полужирный?: StringboolYAML
  Зачеркивание?: StringboolYAML
}

export const FontJSONSchema = Type.Object({
  Вид: Type.Optional(
    Type.String({
      examples: ["ОбычныйШрифтТекста", "СистемныйШрифт", "ЭлементСтиля.ОсновнойШрифт"],
      description: "Встроенный шрифт или ссылка на элемент стиля проекта: ЭлементСтиля.<ИмяЭлементаСтиля>.",
    })
  ),
  ВидXML: Type.Optional(Type.String()),
  Значение: Type.Optional(Type.String()),
  Имя: Type.Optional(Type.String()),
  Масштаб: Type.Optional(Type.Number()),
  Размер: Type.Optional(Type.Number()),
  Наклонный: Type.Optional(BooleanJSONSchema),
  Подчеркивание: Type.Optional(BooleanJSONSchema),
  Полужирный: Type.Optional(BooleanJSONSchema),
  Зачеркивание: Type.Optional(BooleanJSONSchema),
})

export type FontYAML = Static<typeof FontJSONSchema>

export interface FontEnterprise {
  Type: "Font"
  Value?: string
  Name?: string
  Scale?: number
  Height?: number
  Bold?: boolean
  Italic?: boolean
  Underline?: boolean
  Strikeout?: boolean
}

export interface FontWidePropertyRule extends WidePropertyRuleBase {
  type: "Font"
}

export type FontRuleParams = Omit<FontWidePropertyRule, "type">

export function fontRule<const Params extends FontRuleParams>(
  params: WideExactRuleParams<FontRuleParams, Params>
): Readonly<{ type: "Font" } & Params> {
  return defineWidePropertyRule("Font", params)
}
