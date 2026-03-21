import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ConditionalAppearanceItemRules } from "./rules"

export type ConditionalAppearanceItem = FormTypeByRule<typeof ConditionalAppearanceItemRules>

export type ConditionalAppearanceItemYAML = YAMLTypeByRule<typeof ConditionalAppearanceItemRules>
