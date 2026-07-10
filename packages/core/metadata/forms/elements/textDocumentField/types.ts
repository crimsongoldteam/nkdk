import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { TextDocumentFieldRules } from "./rules"

export type TextDocumentField = FormTypeByRule<typeof TextDocumentFieldRules>

export type TextDocumentFieldPartialYAML = YAMLTypeByRule<typeof TextDocumentFieldRules>

export type TextDocumentFieldEnterprise = EnterpriseType<typeof TextDocumentFieldRules>
