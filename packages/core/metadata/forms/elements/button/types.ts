import { ElementTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ButtonRules } from "./rules"

export type Button = ElementTypeByRule<typeof ButtonRules>

export type ButtonPartialYAML = YAMLTypeByRule<typeof ButtonRules>

export interface ButtonTypedYAML extends ButtonPartialYAML {
  Тип: "Кнопка"
}

export type ButtonEnterprise = EnterpriseType<typeof ButtonRules>
