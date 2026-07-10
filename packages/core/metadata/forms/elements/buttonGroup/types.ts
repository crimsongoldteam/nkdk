import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { ButtonGroupRules } from "./rules"

export type ButtonGroup = FormTypeByRule<typeof ButtonGroupRules>

export type ButtonGroupPartialYAML = YAMLTypeByRule<typeof ButtonGroupRules>

export interface ButtonGroupTypedYAML extends ButtonGroupPartialYAML {
  Тип: "ГруппаКнопок"
}

export type ButtonGroupEnterprise = EnterpriseType<typeof ButtonGroupRules>
