import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { TSchema, Type } from "typebox"
import {
  ColorType,
  StyleColorsFromYAML,
  WebColorsFromYAML,
  WindowsColorsFromYAML,
} from "../../systemEnumerations/types"
import { buildMetadataTargetSchema, type MetadataTargetConstraint } from "../metadataTargets"

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

const literalSchemas = (values: string[]): TSchema[] => values.map((key) => Type.Literal(key))

const colorNameSchemas = literalSchemas([
  ...Object.keys(StyleColorsFromYAML),
  ...Object.keys(WindowsColorsFromYAML),
  ...Object.keys(WebColorsFromYAML),
])

export const AbsoluteColorJSONSchema = Type.String({ pattern: "^#[0-9A-Fa-f]{6}$" })
export const RawColorRefJSONSchema = Type.String({ pattern: rawColorRefPattern.source })
export const colorStyleItemTarget = {
  kind: "object",
  roots: ["StyleItem"],
  filters: [{ kind: "styleItemType", values: ["Color"] }],
} as const satisfies MetadataTargetConstraint
export const CustomStyleColorJSONSchema = buildMetadataTargetSchema(colorStyleItemTarget)
export const ColorJSONSchema = Type.Union([
  CustomStyleColorJSONSchema,
  AbsoluteColorJSONSchema,
  RawColorRefJSONSchema,
  ...colorNameSchemas,
])

export type ColorYAML = string

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

export interface ColorWidePropertyRule extends WidePropertyRuleBase {
  type: "Color"
}

export type ColorRuleParams = Omit<ColorWidePropertyRule, "type">

export function colorRule<const Params extends ColorRuleParams>(
  params: WideExactRuleParams<ColorRuleParams, Params>
): Readonly<{ type: "Color" } & Params> {
  return defineWidePropertyRule("Color", params)
}
