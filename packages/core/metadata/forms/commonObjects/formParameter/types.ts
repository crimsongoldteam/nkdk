import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"
import { Type } from "@sinclair/typebox"
import type { Static } from "@sinclair/typebox"
import { StringboolXML } from "../../../commonObjects/boolean/types"
import {
  TypeDescription,
  TypeDescriptionJSONSchema,
  TypeDescriptionXML,
} from "../../../commonObjects/typeDescription/types"

export interface FormParameter {
  name: string
  type?: TypeDescription
  keyParameter?: boolean
}

export type FormParameters = FormParameter[]

export interface FormParameterXML {
  _name: string
  Type?: TypeDescriptionXML
  KeyParameter?: StringboolXML
}

export type FormParametersXML = FormParameterXML | FormParameterXML[]

export const FormParameterJSONSchema = Type.Object({
  Тип: Type.Optional(TypeDescriptionJSONSchema),
  Ключевой: Type.Optional(Type.Boolean()),
})

export type FormParameterYAML = Static<typeof FormParameterJSONSchema>

export const FormParametersJSONSchema = Type.Record(Type.String(), FormParameterJSONSchema)

export type FormParametersYAML = Static<typeof FormParametersJSONSchema>

export interface FormParametersWidePropertyRule extends WidePropertyRuleBase {
  type: "FormParameters"
}

export type FormParametersRuleParams = Omit<FormParametersWidePropertyRule, "type">

export function formParametersRule<const Params extends FormParametersRuleParams>(
  params: WideExactRuleParams<FormParametersRuleParams, Params>
): Readonly<{ type: "FormParameters" } & Params> {
  return defineWidePropertyRule("FormParameters", params)
}
