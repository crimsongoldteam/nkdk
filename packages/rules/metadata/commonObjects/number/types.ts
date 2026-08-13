import { Type } from "typebox"
import type { Static } from "typebox"
import { definePropertyRule, type ExactRuleParams } from "../ruleBuilder"
import type { BasePropertyRule } from "../../ruleRuntime"

export const NumberJSONSchema = Type.Number()

export type NumberYAML = Static<typeof NumberJSONSchema>

export interface NumberMaximumWhen {
  /** Модельный ключ соседнего свойства-переключателя. */
  propertyKey: string
  /** Внутреннее значение перечисления, например Number. */
  equals: string
  maximum: number
}

export interface NumberPropertyRule extends BasePropertyRule {
  type: "number"
  minimum?: number
  maximum?: number
  maximumWhen?: NumberMaximumWhen
  /** Выгружать число с указанием `xsi:type`. `true` сохраняет старое поведение: `xs:decimal`. */
  typedXML?: true | "xs:decimal" | "xs:string"
}

export type NumberRuleParams = Omit<NumberPropertyRule, "type">

export function numberRule(): Readonly<{ type: "number" }>
export function numberRule<const Params extends NumberRuleParams>(
  params: ExactRuleParams<NumberRuleParams, Params>
): Readonly<{ type: "number" } & Params>
export function numberRule(params: NumberRuleParams = {}): Readonly<{ type: "number" } & NumberRuleParams> {
  return definePropertyRule("number", params)
}
