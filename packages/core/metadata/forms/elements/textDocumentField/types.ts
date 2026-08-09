import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { TextDocumentFieldRules } from "./rules"

export type TextDocumentField = FormTypeByRule<typeof TextDocumentFieldRules>

export type TextDocumentFieldPartialYAML = YAMLTypeByRule<typeof TextDocumentFieldRules>

export type TextDocumentFieldEnterprise = EnterpriseType<typeof TextDocumentFieldRules>
