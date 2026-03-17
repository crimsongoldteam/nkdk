import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { CalendarFieldRules } from "./rules"

export type CalendarField = FormTypeByRule<typeof CalendarFieldRules>

export type CalendarFieldPartialYAML = YAMLTypeByRule<typeof CalendarFieldRules>

export type CalendarFieldEnterprise = EnterpriseType<typeof CalendarFieldRules>
