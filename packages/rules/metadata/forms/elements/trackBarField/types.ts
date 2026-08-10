import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { TrackBarFieldRules } from "./rules"

export type TrackBarField = FormTypeByRule<typeof TrackBarFieldRules>

export type TrackBarFieldPartialYAML = YAMLTypeByRule<typeof TrackBarFieldRules>

export interface TrackBarFieldTypedYAML extends TrackBarFieldPartialYAML {
  Тип: "ПолеПолосыПрокрутки"
}

export type TrackBarFieldEnterprise = EnterpriseType<typeof TrackBarFieldRules>
