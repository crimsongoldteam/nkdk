import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"
import type {
  ParameterValueXML,
  SettingsParameterValue,
  SettingsParameterValuePropertyRule,
  SettingsParameterValueYAML,
} from "../parameterValue/types"
import { XML_PRESENT_TAG_VALUE } from "@nkdk/runtime"

/** Набор правил для элементов коллекции `dcscor:item` (настройки параметра СКД). */
export type SettingsParameterValueRuleSet = {
  defaultItemRule?: SettingsParameterValuePropertyRule
  parameterRules?: Partial<Record<string, SettingsParameterValuePropertyRule>>
}

export type SettingsParameterValueCollection = {
  itemType: "SettingsParameterValueCollection"
  parameters: Record<string, SettingsParameterValue>
}

/** Под ключом YAML — имя параметра (как в `dcscor:parameter`). */
export type SettingsParameterValueCollectionYAML =
  | Record<string, SettingsParameterValueYAML>
  | typeof XML_PRESENT_TAG_VALUE

export type SettingsParameterValueCollectionXML = {
  "dcscor:item"?: ParameterValueXML | ParameterValueXML[]
}

export interface SettingsParameterValueCollectionWidePropertyRule extends WidePropertyRuleBase {
  type: "SettingsParameterValueCollection"
}

export type SettingsParameterValueCollectionRuleParams = Omit<SettingsParameterValueCollectionWidePropertyRule, "type">

export function settingsParameterValueCollectionRule<const Params extends SettingsParameterValueCollectionRuleParams>(
  params: WideExactRuleParams<SettingsParameterValueCollectionRuleParams, Params>
): Readonly<{ type: "SettingsParameterValueCollection" } & Params> {
  return defineWidePropertyRule("SettingsParameterValueCollection", {
    configurationIndexAddressing: "yamlPath" as const,
    ...params,
  })
}
