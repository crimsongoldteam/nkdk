import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { SpreadSheetDocumentFieldRules } from "./rules"

export type SpreadSheetDocumentField = FormTypeByRule<typeof SpreadSheetDocumentFieldRules>

export type SpreadSheetDocumentFieldPartialYAML = YAMLTypeByRule<typeof SpreadSheetDocumentFieldRules>

export type SpreadSheetDocumentFieldEnterprise = EnterpriseType<typeof SpreadSheetDocumentFieldRules>
