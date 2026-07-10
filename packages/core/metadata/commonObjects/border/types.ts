import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "typebox"
import type { Static } from "typebox"
import * as SE from "../../systemEnumerations/types"
import { buildMetadataTargetSchema, type MetadataTargetConstraint } from "../metadataTargets"

export interface Border {
  ref?: string
  width?: number
  controlBorderType?: SE.ControlBorderType
}

export interface BorderStyleObject {
  "#text"?: string
  "_xsi:type"?: string
}

export interface BorderXML {
  _ref?: string
  _width?: number
  "v8ui:style"?: string | BorderStyleObject
}

export const borderStyleItemTarget = {
  kind: "object",
  roots: ["StyleItem"],
  filters: [{ kind: "styleItemType", values: ["Border"] }],
} as const satisfies MetadataTargetConstraint

export const BorderJSONSchema = Type.Object({
  Имя: Type.Optional(Type.Union([buildMetadataTargetSchema(borderStyleItemTarget), Type.Null()])),
  Ширина: Type.Optional(Type.Number()),
  ТипРамки: Type.Optional(Type.String()),
})

export type BorderYAML = Static<typeof BorderJSONSchema>

export interface BorderEnterprise {
  Type: "Border"
  Width?: number
  Value?: `ControlBorderType.${SE.ControlBorderType}`
}

export interface BorderWidePropertyRule extends WidePropertyRuleBase {
  type: "Border"
}

export type BorderRuleParams = Omit<BorderWidePropertyRule, "type">

export function borderRule<const Params extends BorderRuleParams>(
  params: WideExactRuleParams<BorderRuleParams, Params>
): Readonly<{ type: "Border" } & Params> {
  return defineWidePropertyRule("Border", params)
}
