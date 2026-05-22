import { Static, Type } from "@sinclair/typebox"
import { ColorType, WebColorsFromYAML } from "~/metadata/systemEnumerations/types"

export interface TypedColor {
  type: ColorType
  value: string
}

export type RawColorRef = { rawRef: string }

export type Color = TypedColor | RawColorRef

export function isRawColorRef(color: Color): color is RawColorRef {
  return "rawRef" in color
}

const rawColorRefPattern = /^0(?::[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})?$/

export function isRawColorRefValue(value: string): boolean {
  return rawColorRefPattern.test(value)
}

export type ColorXML = string

const webColors = Object.keys(WebColorsFromYAML).map((key) => Type.Literal(key))

export const AbsoluteColorJSONSchema = Type.String({ pattern: "^#[0-9A-Fa-f]{6}$" })
export const RawColorRefJSONSchema = Type.String({ pattern: rawColorRefPattern.source })
export const ColorJSONSchema = Type.Union([...webColors, AbsoluteColorJSONSchema, RawColorRefJSONSchema])

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
