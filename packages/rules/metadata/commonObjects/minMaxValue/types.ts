import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"

export type MinMaxValueXsiType = "xs:string" | "xs:decimal"

export type MinMaxValueModel =
  | number
  | { readonly kind: "xml"; readonly xsiType?: string; readonly text: string }

export function parseMinMaxXMLTypePayload(payload: string): MinMaxValueModel {
  const separator = payload.indexOf(" ")
  if (separator <= 0) throw new Error("после !xml/type ожидаются QName и значение")
  const qName = payload.slice(0, separator)
  const text = payload.slice(separator + 1)
  if (text.length === 0) throw new Error("после QName ожидается значение")
  return { kind: "xml", ...(qName === "-" ? {} : { xsiType: qName }), text }
}

export function formatMinMaxXMLTypePayload(value: Exclude<MinMaxValueModel, number>): string {
  return `${value.xsiType ?? "-"} ${value.text}`
}

export interface MinMaxValueWidePropertyRule extends WidePropertyRuleBase {
  type: "MinMaxValue"
}

export type MinMaxValueRuleParams = Omit<MinMaxValueWidePropertyRule, "type">

export function minMaxValueRule<const Params extends MinMaxValueRuleParams>(
  params: WideExactRuleParams<MinMaxValueRuleParams, Params>
): Readonly<{ type: "MinMaxValue" } & Params> {
  return defineWidePropertyRule("MinMaxValue", params)
}
