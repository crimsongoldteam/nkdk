import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { PictureDecorationRules } from "./rules"

export type PictureDecoration = FormTypeByRule<typeof PictureDecorationRules>

export type PictureDecorationPartialYAML = YAMLTypeByRule<typeof PictureDecorationRules>

export type PictureDecorationEnterprise = EnterpriseType<typeof PictureDecorationRules>
