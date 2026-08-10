import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { PagesRules } from "./rules"

export type Pages = FormTypeByRule<typeof PagesRules>

export type PagesPartialYAML = YAMLTypeByRule<typeof PagesRules>

export interface PagesTypedYAML extends PagesPartialYAML {
  Тип: "Страницы"
}

export type PagesEnterprise = EnterpriseType<typeof PagesRules>
