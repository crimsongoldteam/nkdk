import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ButtonRules, CommandBarButtonRules } from "./rules"

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
