import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"
import type { StringboolYAML } from "../../boolean/types"
import type { I8nText, I8nTextXML, I8nTextYAML } from "../../i8nText/types"
import type * as SE from "../../../systemEnumerations/types"

export type AvailableFieldItem =
  | string
  | {
      field: string
      use?: boolean
      title?: I8nText
      lwsTitle?: I8nText
      viewMode?: SE.DataCompositionSettingsItemViewMode
    }

export type AvailableFields = AvailableFieldItem[]

export type AvailableFieldItemYAML =
  | string
  | {
      Поле: string
      Использование?: StringboolYAML
      Заголовок?: I8nTextYAML
      МногоязычныйЗаголовок?: I8nTextYAML
      РежимОтображения?: SE.DataCompositionSettingsItemViewModeYAML
    }

export type AvailableFieldsYAML = AvailableFieldItemYAML[]

export type AvailableFieldXML = {
  "dcsset:field": string | { "#text"?: string }
  "dcsset:use"?: boolean | string
  "dcsset:title"?: I8nTextXML
  "dcsset:lwsTitle"?: I8nTextXML
  "dcsset:viewMode"?: SE.DataCompositionSettingsItemViewMode
}

export type AvailableFieldsXML = {
  "dcsset:item"?: AvailableFieldXML | AvailableFieldXML[]
}

export interface AvailableFieldsWidePropertyRule extends WidePropertyRuleBase {
  type: "AvailableFields"
}

export type AvailableFieldsRuleParams = Omit<AvailableFieldsWidePropertyRule, "type">

export function availableFieldsRule<const Params extends AvailableFieldsRuleParams>(
  params: WideExactRuleParams<AvailableFieldsRuleParams, Params>
): Readonly<{ type: "AvailableFields" } & Params> {
  return defineWidePropertyRule("AvailableFields", { configurationIndexAddressing: "yamlPath" as const, ...params })
}
