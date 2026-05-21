import { FormattedI8nTextYAML } from "~/metadata/commonObjects/formattedI8nText/types"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PictureDecorationRules } from "./rules"

export type PictureDecoration = FormTypeByRule<typeof PictureDecorationRules>

export type PictureDecorationPartialYAML = YAMLTypeByRule<typeof PictureDecorationRules> & {
  ФорматированныйЗаголовок?: FormattedI8nTextYAML
}

export type PictureDecorationEnterprise = EnterpriseType<typeof PictureDecorationRules>
