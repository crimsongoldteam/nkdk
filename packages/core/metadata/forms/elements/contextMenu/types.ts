import { StringboolYAML } from "../../../commonObjects/boolean/types"
import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import * as SE from "../../../systemEnumerations/types"
import { FormElementTreeYAML } from "../../commonObjects/childItems/types"
import { ContextMenuRules } from "./rules"

export type ContextMenu = FormTypeByRule<typeof ContextMenuRules>

export interface ContextMenuYAML {
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  Автозаполнение?: StringboolYAML
  Элементы?: FormElementTreeYAML
}

export type ContextMenuEnterprise = EnterpriseType<typeof ContextMenuRules>
