import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { CommandBarGroupChildItemsTypedYAML } from "../../commonObjects/childItems/types"
import { ContextMenuRules } from "./rules"

export type ContextMenu = FormTypeByRule<typeof ContextMenuRules>

export interface ContextMenuYAML {
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  Автозаполнение?: StringboolYAML
  Элементы?: CommandBarGroupChildItemsTypedYAML
}

export type ContextMenuEnterprise = EnterpriseType<typeof ContextMenuRules>
