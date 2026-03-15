import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { SpreadSheetDocumentFieldRules } from "./rules"

export type SpreadSheetDocumentField = FormTypeByRule<typeof SpreadSheetDocumentFieldRules>

export type SpreadSheetDocumentFieldPartialYAML = YAMLTypeByRule<typeof SpreadSheetDocumentFieldRules>

export type SpreadSheetDocumentFieldEnterprise = EnterpriseType<typeof SpreadSheetDocumentFieldRules>
