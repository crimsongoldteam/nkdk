import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { UsualGroupRules } from "./rules"

export type UsualGroup = FormTypeByRule<typeof UsualGroupRules>

export type UsualGroupPartialYAML = YAMLTypeByRule<typeof UsualGroupRules>

export interface UsualGroupTypedYAML extends UsualGroupPartialYAML {
  Тип: "Группа"
}

export type UsualGroupEnterprise = EnterpriseType<typeof UsualGroupRules>
