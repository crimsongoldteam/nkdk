import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PDFDocumentFieldRules } from "./rules"

export type PDFDocumentField = FormTypeByRule<typeof PDFDocumentFieldRules>

export type PDFDocumentFieldPartialYAML = YAMLTypeByRule<typeof PDFDocumentFieldRules>

export type PDFDocumentFieldEnterprise = EnterpriseType<typeof PDFDocumentFieldRules>
