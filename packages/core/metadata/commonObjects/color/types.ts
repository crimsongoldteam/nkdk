import { ColorType } from "~/metadata/systemEnumerations/types"

export interface Color {
  type: ColorType
  value: string
}

export type ColorXML = string

export type ColorEnterprise = string

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

export interface ColorPreview {
  type: string
  value: string
}
