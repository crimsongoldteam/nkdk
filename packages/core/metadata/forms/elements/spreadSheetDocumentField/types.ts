import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { SpreadSheetDocumentFieldRules } from "./rules"

export type SpreadSheetDocumentField = FormTypeByRule<typeof SpreadSheetDocumentFieldRules>

export type SpreadSheetDocumentFieldPartialYAML = YAMLTypeByRule<typeof SpreadSheetDocumentFieldRules>

export type SpreadSheetDocumentFieldEnterprise = EnterpriseType<typeof SpreadSheetDocumentFieldRules>
