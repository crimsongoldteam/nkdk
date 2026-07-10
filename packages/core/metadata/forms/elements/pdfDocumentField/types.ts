import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { PDFDocumentFieldRules } from "./rules"

export type PDFDocumentField = FormTypeByRule<typeof PDFDocumentFieldRules>

export type PDFDocumentFieldPartialYAML = YAMLTypeByRule<typeof PDFDocumentFieldRules>

export type PDFDocumentFieldEnterprise = EnterpriseType<typeof PDFDocumentFieldRules>
