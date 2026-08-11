import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { ButtonGroupRules } from "./rules"

export type ButtonGroup = FormTypeByRule<typeof ButtonGroupRules>

export type ButtonGroupPartialYAML = YAMLTypeByRule<typeof ButtonGroupRules>

export interface ButtonGroupTypedYAML extends ButtonGroupPartialYAML {
  Тип: "ГруппаКнопок"
}

export type ButtonGroupEnterprise = EnterpriseType<typeof ButtonGroupRules>
