import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "typebox"
import type { Static } from "typebox"

export type FunctionalOptions = string[]

export interface FunctionalOptionsXML {
  Item?: string | undefined | (string | undefined)[]
}

export const FunctionalOptionsPropertyJSONSchema = Type.Array(Type.String())
export type FunctionalOptionsYAML = Static<typeof FunctionalOptionsPropertyJSONSchema>

export interface FunctionalOptionsPropertyWidePropertyRule extends WidePropertyRuleBase {
  type: "FunctionalOptionsProperty"
}

export type FunctionalOptionsPropertyRuleParams = Omit<FunctionalOptionsPropertyWidePropertyRule, "type">

export function functionalOptionsPropertyRule<const Params extends FunctionalOptionsPropertyRuleParams>(
  params: WideExactRuleParams<FunctionalOptionsPropertyRuleParams, Params>
): Readonly<{ type: "FunctionalOptionsProperty" } & Params> {
  return defineWidePropertyRule("FunctionalOptionsProperty", params)
}
