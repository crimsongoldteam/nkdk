import * as SE from "~/metadata/systemEnumerations/types"
import { StringboolEnterprise } from "../boolean/types"

export const PrefixedFontsFromXML: Record<string, SE.StyleFonts | SE.WindowsFonts> = {
  "style:LargeTextFont": "LargeTextFont",
  "style:SmallTextFont": "SmallTextFont",
  "style:NormalTextFont": "NormalTextFont",
  "style:ExtraLargeTextFont": "ExtraLargeTextFont",
  "style:TextFont": "TextFont",
  "sys: ANSIFixedFont": "ANSIFixedFont",
  "sys:ANSIVariableFont": "ANSIVariableFont",
  "sys:OEMFixedFont": "OEMFixedFont",
  "sys:SystemFont": "SystemFont",
  "sys:DefaultGUIFont": "DefaultGUIFont",
} as const

export const PrefixedFontsToXML = Object.fromEntries(
  Object.entries(PrefixedFontsFromXML).map(([key, value]) => [value, key])
)

export type PrefixedFontsXML = keyof typeof PrefixedFontsFromXML

export interface FontXML {
  _ref?: PrefixedFontsXML
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
  ref?: SE.StyleFonts | SE.WindowsFonts
  faceName?: string
  scale?: number
  height?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikeout?: boolean
  kind: SE.FontType
}

export interface FontFullEnterprise {
  Имя: string
  Масштаб: number
  Размер: number
  Наклонный: StringboolEnterprise
  Подчеркивание: StringboolEnterprise
  Полужирный: StringboolEnterprise
  Зачеркивание: StringboolEnterprise
  Вид: SE.StyleFontsEnterprise | SE.WindowsFontsEnterprise
}

export type FontCompactEnterprise = string

export type FontEnterprise = FontFullEnterprise | FontCompactEnterprise
