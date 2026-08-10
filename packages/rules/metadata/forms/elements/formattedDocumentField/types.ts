import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { FormattedDocumentFieldRules } from "./rules"

export type FormattedDocumentField = FormTypeByRule<typeof FormattedDocumentFieldRules>

export type FormattedDocumentFieldPartialYAML = YAMLTypeByRule<typeof FormattedDocumentFieldRules>

export type FormattedDocumentFieldEnterprise = EnterpriseType<typeof FormattedDocumentFieldRules>
