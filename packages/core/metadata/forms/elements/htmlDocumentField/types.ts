import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { HTMLDocumentFieldRules } from "./rules"

export type HTMLDocumentField = FormTypeByRule<typeof HTMLDocumentFieldRules>

export type HTMLDocumentFieldPartialYAML = YAMLTypeByRule<typeof HTMLDocumentFieldRules>

export type HTMLDocumentFieldEnterprise = EnterpriseType<typeof HTMLDocumentFieldRules>
