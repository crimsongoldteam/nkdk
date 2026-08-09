import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { UsualGroupRules } from "./rules"

export type UsualGroup = FormTypeByRule<typeof UsualGroupRules>

export type UsualGroupPartialYAML = YAMLTypeByRule<typeof UsualGroupRules>

export interface UsualGroupTypedYAML extends UsualGroupPartialYAML {
  Тип: "Группа"
}

export type UsualGroupEnterprise = EnterpriseType<typeof UsualGroupRules>
