import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { CalendarFieldRules } from "./rules"

export type CalendarField = FormTypeByRule<typeof CalendarFieldRules>

export type CalendarFieldPartialYAML = YAMLTypeByRule<typeof CalendarFieldRules>

export type CalendarFieldEnterprise = EnterpriseType<typeof CalendarFieldRules>
