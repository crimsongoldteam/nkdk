import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { HTMLDocumentFieldRules } from "./rules"

export type HTMLDocumentField = FormTypeByRule<typeof HTMLDocumentFieldRules>

export type HTMLDocumentFieldPartialYAML = YAMLTypeByRule<typeof HTMLDocumentFieldRules>

export type HTMLDocumentFieldEnterprise = EnterpriseType<typeof HTMLDocumentFieldRules>
