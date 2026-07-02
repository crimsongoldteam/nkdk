import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { UsualGroupRules } from "./rules"

export type UsualGroup = FormTypeByRule<typeof UsualGroupRules>

export type UsualGroupPartialYAML = YAMLTypeByRule<typeof UsualGroupRules>

export interface UsualGroupTypedYAML extends UsualGroupPartialYAML {
  Тип: "Группа"
}

export type UsualGroupEnterprise = EnterpriseType<typeof UsualGroupRules>
