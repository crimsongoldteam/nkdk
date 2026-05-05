import type {
  ParameterValueXML,
  SettingsParameterValue,
  SettingsParameterValuePropertyRule,
  SettingsParameterValueYAML,
} from "../parameterValue/types"

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
export type SettingsParameterValueCollectionYAML = Record<string, SettingsParameterValueYAML>

export type SettingsParameterValueCollectionXML = {
  "dcscor:item"?: ParameterValueXML | ParameterValueXML[]
}
