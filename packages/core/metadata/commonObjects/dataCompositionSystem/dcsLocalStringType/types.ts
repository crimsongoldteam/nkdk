import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import type { I8nText } from "~/metadata/commonObjects/i8nText/types"

export type DcsLocalStringTypeXML =
  | string
  | {
      "_xsi:type"?: string
      "#text"?: unknown
      "v8:item"?: unknown
    }
  | undefined

export type DcsLocalStringTypeReference = I8nText | string

export interface DcsLocalStringTypeWidePropertyRule extends WidePropertyRuleBase {
  type: "DcsLocalStringType"
}

export type DcsLocalStringTypeRuleParams = Omit<DcsLocalStringTypeWidePropertyRule, "type">

export function dcsLocalStringTypeRule<const Params extends DcsLocalStringTypeRuleParams>(
  params: WideExactRuleParams<DcsLocalStringTypeRuleParams, Params>
): Readonly<{ type: "DcsLocalStringType" } & Params> {
  return defineWidePropertyRule("DcsLocalStringType", params)
}
