import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { ButtonRules, CommandBarButtonRules } from "./rules"
export type { ButtonParameter } from "./parameter"

export type Button = FormTypeByRule<typeof ButtonRules>

export type ButtonPartialYAML = YAMLTypeByRule<typeof ButtonRules>

export interface ButtonTypedYAML extends ButtonPartialYAML {
  Тип: "Кнопка"
}

export type ButtonEnterprise = EnterpriseType<typeof ButtonRules>

export type CommandBarButton = FormTypeByRule<typeof CommandBarButtonRules>

export type CommandBarButtonPartialYAML = YAMLTypeByRule<typeof CommandBarButtonRules>

export interface CommandBarButtonTypedYAML extends CommandBarButtonPartialYAML {
  Тип: "КнопкаКоманднойПанели"
}

export type CommandBarButtonEnterprise = EnterpriseType<typeof CommandBarButtonRules>
