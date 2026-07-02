import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { PictureDecorationRules } from "./rules"

export type PictureDecoration = FormTypeByRule<typeof PictureDecorationRules>

export type PictureDecorationPartialYAML = YAMLTypeByRule<typeof PictureDecorationRules>

export type PictureDecorationEnterprise = EnterpriseType<typeof PictureDecorationRules>
