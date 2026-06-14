import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PictureDecorationRules } from "./rules"

export type PictureDecoration = FormTypeByRule<typeof PictureDecorationRules>

export type PictureDecorationPartialYAML = YAMLTypeByRule<typeof PictureDecorationRules>

export type PictureDecorationEnterprise = EnterpriseType<typeof PictureDecorationRules>
