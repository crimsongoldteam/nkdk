import { StringboolYAML } from "../../../commonObjects/boolean/types"
import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import * as SE from "../../../systemEnumerations/types"
import type { FormElementTreeYAML } from "../../commonObjects/childItems/contracts"
import { ContextMenuRules } from "./rules"

export type ContextMenu = FormTypeByRule<typeof ContextMenuRules>

export interface ContextMenuYAML {
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  Автозаполнение?: StringboolYAML
  Элементы?: FormElementTreeYAML
}

export type ContextMenuEnterprise = EnterpriseType<typeof ContextMenuRules>
