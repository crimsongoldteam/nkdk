import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { FormattedDocumentFieldRules } from "./rules"

export type FormattedDocumentField = FormTypeByRule<typeof FormattedDocumentFieldRules>

export type FormattedDocumentFieldPartialYAML = YAMLTypeByRule<typeof FormattedDocumentFieldRules>

export type FormattedDocumentFieldEnterprise = EnterpriseType<typeof FormattedDocumentFieldRules>
