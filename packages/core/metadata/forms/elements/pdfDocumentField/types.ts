import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { PDFDocumentFieldRules } from "./rules"

export type PDFDocumentField = FormTypeByRule<typeof PDFDocumentFieldRules>

export type PDFDocumentFieldPartialYAML = YAMLTypeByRule<typeof PDFDocumentFieldRules>

export type PDFDocumentFieldEnterprise = EnterpriseType<typeof PDFDocumentFieldRules>
