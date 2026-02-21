import * as SE from "~/metadata/systemEnumerations/types"
import { StringboolYAML } from "../boolean/types"

export const PrefixedFontsFromXML: Record<string, SE.StyleFonts | SE.WindowsFonts> = {
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
  kind: SE.FontType
  ref?: SE.StyleFonts | SE.WindowsFonts
  faceName?: string
  scale?: number
  height?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikeout?: boolean
}

export interface FontFullYAML {
  Вид?: SE.StyleFontsYAML | SE.WindowsFontsYAML
  Имя?: string
  Масштаб?: number
  Размер?: number
  Наклонный?: StringboolYAML
  Подчеркивание?: StringboolYAML
  Полужирный?: StringboolYAML
  Зачеркивание?: StringboolYAML
}

export type FontCompactYAML = string

export type FontYAML = FontFullYAML | FontCompactYAML

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
