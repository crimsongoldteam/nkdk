import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
const MIN_MAX_VALUE_XSI_TYPE: unique symbol = Symbol("minMaxValueXsiType")
const MIN_MAX_VALUE_XML_TEXT: unique symbol = Symbol("minMaxValueXMLText")

export type MinMaxValueXsiType = "xs:string" | "xs:decimal"

export type MinMaxValueReference = Number & {
  [MIN_MAX_VALUE_XSI_TYPE]?: MinMaxValueXsiType
  [MIN_MAX_VALUE_XML_TEXT]?: string
}

export const attachMinMaxValueXsiType = (
  value: number,
  xsiType: MinMaxValueXsiType,
  xmlText?: string
): MinMaxValueReference => {
  const referenceValue = new Number(value) as MinMaxValueReference

  Object.defineProperty(referenceValue, MIN_MAX_VALUE_XSI_TYPE, {
    value: xsiType,
    enumerable: false,
  })

  if (xmlText !== undefined) {
    Object.defineProperty(referenceValue, MIN_MAX_VALUE_XML_TEXT, {
      value: xmlText,
      enumerable: false,
    })
  }

  return referenceValue
}

export const getMinMaxValueXsiType = (value: unknown): MinMaxValueXsiType | undefined => {
  if (value === undefined || value === null) return undefined
  if (typeof value !== "object") return undefined

  return (value as MinMaxValueReference)[MIN_MAX_VALUE_XSI_TYPE]
}

export const getMinMaxValueXMLText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined
  if (typeof value !== "object") return undefined

  return (value as MinMaxValueReference)[MIN_MAX_VALUE_XML_TEXT]
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
