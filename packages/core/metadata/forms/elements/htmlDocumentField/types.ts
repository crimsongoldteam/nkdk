import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { HTMLDocumentFieldRules } from "./rules"

export type HTMLDocumentField = FormTypeByRule<typeof HTMLDocumentFieldRules>

export type HTMLDocumentFieldPartialYAML = YAMLTypeByRule<typeof HTMLDocumentFieldRules>

export type HTMLDocumentFieldEnterprise = EnterpriseType<typeof HTMLDocumentFieldRules>
