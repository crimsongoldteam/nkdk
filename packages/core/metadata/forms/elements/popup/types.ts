import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { PopupRules } from "./rules"

export type Popup = FormTypeByRule<typeof PopupRules>

export type PopupPartialYAML = YAMLTypeByRule<typeof PopupRules>

export interface PopupTypedYAML extends PopupPartialYAML {
  Тип: "Подменю"
}

export type PopupEnterprise = EnterpriseType<typeof PopupRules>
