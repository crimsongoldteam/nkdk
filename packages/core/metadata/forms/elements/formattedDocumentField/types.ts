import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { FormattedDocumentFieldRules } from "./rules"

export type FormattedDocumentField = FormTypeByRule<typeof FormattedDocumentFieldRules>

export type FormattedDocumentFieldPartialYAML = YAMLTypeByRule<typeof FormattedDocumentFieldRules>

export type FormattedDocumentFieldEnterprise = EnterpriseType<typeof FormattedDocumentFieldRules>
