import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { TrackBarFieldRules } from "./rules"

export type TrackBarField = FormTypeByRule<typeof TrackBarFieldRules>

export type TrackBarFieldPartialYAML = YAMLTypeByRule<typeof TrackBarFieldRules>

export interface TrackBarFieldTypedYAML extends TrackBarFieldPartialYAML {
  Тип: "ПолеПолосыПрокрутки"
}

export type TrackBarFieldEnterprise = EnterpriseType<typeof TrackBarFieldRules>
