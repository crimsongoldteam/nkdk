import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { CalendarFieldRules } from "./rules"

export type CalendarField = FormTypeByRule<typeof CalendarFieldRules>

export type CalendarFieldPartialYAML = YAMLTypeByRule<typeof CalendarFieldRules>

export type CalendarFieldEnterprise = EnterpriseType<typeof CalendarFieldRules>
