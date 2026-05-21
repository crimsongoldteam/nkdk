import { FormattedI8nTextYAML } from "~/metadata/commonObjects/formattedI8nText/types"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { LabelDecorationRules } from "./rules"

export type LabelDecoration = FormTypeByRule<typeof LabelDecorationRules>

export type LabelDecorationPartialYAML = YAMLTypeByRule<typeof LabelDecorationRules> & {
  ФорматированныйЗаголовок?: FormattedI8nTextYAML
}

export type LabelDecorationEnterprise = EnterpriseType<typeof LabelDecorationRules>
