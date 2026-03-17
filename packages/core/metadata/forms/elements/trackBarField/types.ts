import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { TrackBarFieldRules } from "./rules"

export type TrackBarField = FormTypeByRule<typeof TrackBarFieldRules>

export type TrackBarFieldPartialYAML = YAMLTypeByRule<typeof TrackBarFieldRules>

export interface TrackBarFieldTypedYAML extends TrackBarFieldPartialYAML {
  Тип: "ПолеПолосыПрокрутки"
}

export type TrackBarFieldEnterprise = EnterpriseType<typeof TrackBarFieldRules>
