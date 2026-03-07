import { Static, Type } from "@sinclair/typebox"
import { ColorType, WebColorsFromYAML } from "~/metadata/systemEnumerations/types"

export interface Color {
  type: ColorType
  value: string
}

export type ColorXML = string

const webColors = Object.keys(WebColorsFromYAML).map((key) => Type.Literal(key))

export const AbsoluteColorJSONSchema = Type.String({ pattern: "^#[0-9A-Fa-f]{6}$" })
export const ColorJSONSchema = Type.Union([...webColors, AbsoluteColorJSONSchema])

export type ColorYAML = Static<typeof ColorJSONSchema>

export const ColorPrefixToType: Record<string, "StyleItem" | "WindowsColor" | "WebColor"> = {
  style: "StyleItem",
  win: "WindowsColor",
  web: "WebColor",
} as const

export const ColorTypeToPrefix: Record<"StyleItem" | "WindowsColor" | "WebColor", string> = {
  StyleItem: "style",
  WindowsColor: "win",
  WebColor: "web",
} as const

export interface PredefiedColorEnterprise {
  Type: "Color"
  Value: string
}

export interface AbsoluteColorEnterprise {
  Type: "AbsoluteColor"
  Red: number
  Green: number
  Blue: number
}

export type ColorEnterprise = PredefiedColorEnterprise | AbsoluteColorEnterprise
