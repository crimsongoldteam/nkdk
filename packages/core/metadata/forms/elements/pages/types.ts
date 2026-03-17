import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PagesRules } from "./rules"

export type Pages = FormTypeByRule<typeof PagesRules>

export type PagesPartialYAML = YAMLTypeByRule<typeof PagesRules>

export interface PagesTypedYAML extends PagesPartialYAML {
  Тип: "Страницы"
}

export type PagesEnterprise = EnterpriseType<typeof PagesRules>
