import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PopupRules } from "./rules"

export type Popup = FormTypeByRule<typeof PopupRules>

export type PopupPartialYAML = YAMLTypeByRule<typeof PopupRules>

export interface PopupTypedYAML extends PopupPartialYAML {
  Тип: "Подменю"
}

export type PopupEnterprise = EnterpriseType<typeof PopupRules>
