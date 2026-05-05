import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ButtonGroupRules } from "./rules"

export type ButtonGroup = FormTypeByRule<typeof ButtonGroupRules>

export type ButtonGroupPartialYAML = YAMLTypeByRule<typeof ButtonGroupRules>

export interface ButtonGroupTypedYAML extends ButtonGroupPartialYAML {
  Тип: "ГруппаКнопок"
}

export type ButtonGroupEnterprise = EnterpriseType<typeof ButtonGroupRules>
