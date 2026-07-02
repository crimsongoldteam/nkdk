import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Type } from "@sinclair/typebox"
import type { Static } from "@sinclair/typebox"
import { BasePropertyRule } from "~/metadata/orchestration"

const russianDateTimePattern =
  "^(0[1-9]|[12][0-9]|3[01])\\.(0[1-9]|1[0-2])\\.[0-9]{4}( ([01][0-9]|2[0-3]):[0-5][0-9])?$"

export const DateTimeJSONSchema = Type.String({ pattern: russianDateTimePattern })

export type DateTimeYAML = Static<typeof DateTimeJSONSchema>

export interface DateTimePropertyRule extends BasePropertyRule {
  type: "dateTime"
  /** Выгружать дату/время с указанием типа: `xsi:type="xs:dateTime"` */
  typedXML?: true
}

export interface dateTimeWidePropertyRule extends WidePropertyRuleBase {
  type: "dateTime"
}

export type dateTimeRuleParams = Omit<dateTimeWidePropertyRule, "type">

export function dateTimeRule<const Params extends dateTimeRuleParams>(
  params: WideExactRuleParams<dateTimeRuleParams, Params>
): Readonly<{ type: "dateTime" } & Params> {
  return defineWidePropertyRule("dateTime", params)
}
