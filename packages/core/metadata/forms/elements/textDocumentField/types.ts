import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { TextDocumentFieldRules } from "./rules"

export type TextDocumentField = FormTypeByRule<typeof TextDocumentFieldRules>

export type TextDocumentFieldPartialYAML = YAMLTypeByRule<typeof TextDocumentFieldRules>

export type TextDocumentFieldEnterprise = EnterpriseType<typeof TextDocumentFieldRules>
