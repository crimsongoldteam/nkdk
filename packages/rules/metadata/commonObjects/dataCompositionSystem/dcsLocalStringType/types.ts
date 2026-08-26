import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"
import type { I8nText } from "../../i8nText/types"

export type DcsLocalStringTypeXML =
  | string
  | {
      "_xsi:type"?: string
      "#text"?: unknown
      "v8:item"?: unknown
    }
  | undefined

export type DcsLocalStringValue = I8nText | { readonly kind: "xmlString"; readonly text: string }

export interface DcsLocalStringTypeWidePropertyRule extends WidePropertyRuleBase {
  type: "DcsLocalStringType"
}

export type DcsLocalStringTypeRuleParams = Omit<DcsLocalStringTypeWidePropertyRule, "type">

export function dcsLocalStringTypeRule<const Params extends DcsLocalStringTypeRuleParams>(
  params: WideExactRuleParams<DcsLocalStringTypeRuleParams, Params>
): Readonly<{ type: "DcsLocalStringType"; preserveUnknownReferenceXML: false } & Params> {
  return defineWidePropertyRule("DcsLocalStringType", {
    preserveUnknownReferenceXML: false,
    ...params,
  })
}
