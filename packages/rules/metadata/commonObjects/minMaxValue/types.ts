import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"

export type MinMaxValueXsiType = "xs:string" | "xs:decimal"

export type MinMaxValueModel =
  | number
  | { readonly kind: "xml"; readonly xsiType?: string; readonly text: string }

export function parseMinMaxXMLPayload(payload: string): MinMaxValueModel {
  const separator = payload.indexOf(" ")
  const marker = separator === -1 ? payload : payload.slice(0, separator)
  const remainder = separator === -1 ? "" : payload.slice(separator + 1)

  if (marker === "String" || marker === "Decimal") {
    if (remainder.length === 0 || !Number.isFinite(Number(remainder.replace(",", ".")))) {
      throw new Error(`${marker}: ожидается конечное число`)
    }
    return {
      kind: "xml",
      xsiType: marker === "String" ? "xs:string" : "xs:decimal",
      text: remainder,
    }
  }

  if (marker === "Raw") {
    const rawSeparator = remainder.indexOf(" ")
    const qName = rawSeparator === -1 ? remainder : remainder.slice(0, rawSeparator)
    if (qName.length === 0) throw new Error("после Raw ожидается QName или -")
    const text = rawSeparator === -1 ? "" : remainder.slice(rawSeparator + 1)
    return { kind: "xml", ...(qName === "-" ? {} : { xsiType: qName }), text }
  }

  throw new Error(`неизвестный маркер MinMaxValue: ${marker}`)
}

export function formatMinMaxXMLPayload(value: Exclude<MinMaxValueModel, number>): string {
  if (value.xsiType === "xs:string") return `String ${value.text}`
  if (value.xsiType === "xs:decimal") return `Decimal ${value.text}`
  return `Raw ${value.xsiType ?? "-"}${value.text.length === 0 ? "" : ` ${value.text}`}`
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
