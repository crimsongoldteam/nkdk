import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "@sinclair/typebox"
import type { Static } from "@sinclair/typebox"
import type { BasePropertyRule } from "../../orchestration/property/types"

export type FieldsList = string[]

export interface FieldsListXML {
  Field?: string | string[]
  "xr:Field"?: string | string[]
}

export type FieldsListXMLItem = "Field" | "xr:Field"

export interface FieldsListPropertyRule extends BasePropertyRule {
  type: "FieldsList"
  fieldsListXMLItem?: FieldsListXMLItem
}

export const FieldsListJSONSchema = Type.Array(Type.String())

export type FieldsListYAML = Static<typeof FieldsListJSONSchema>

export interface FieldsListWidePropertyRule extends WidePropertyRuleBase {
  type: "FieldsList"
}

export type FieldsListRuleParams = Omit<FieldsListWidePropertyRule, "type">

export function fieldsListRule<const Params extends FieldsListRuleParams>(
  params: WideExactRuleParams<FieldsListRuleParams, Params>
): Readonly<{ type: "FieldsList" } & Params> {
  return defineWidePropertyRule("FieldsList", params)
}
