import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { PopupRules } from "./rules"

export type Popup = FormTypeByRule<typeof PopupRules>

export type PopupPartialYAML = YAMLTypeByRule<typeof PopupRules>

export interface PopupTypedYAML extends PopupPartialYAML {
  Тип: "Подменю"
}

export type PopupEnterprise = EnterpriseType<typeof PopupRules>
