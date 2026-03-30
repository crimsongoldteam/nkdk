import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import type { GroupItemAuto, GroupItemAutoYAML } from "../groupItemAuto/types"
import { GroupItemFieldRules } from "./rules"

export type GroupItemField = FormTypeByRule<typeof GroupItemFieldRules>

export type GroupItemFieldYAML = YAMLTypeByRule<typeof GroupItemFieldRules>

export type GroupItem = (GroupItemField | GroupItemAuto)[]
export type GroupItemYAML = (GroupItemFieldYAML | GroupItemAutoYAML)[]
