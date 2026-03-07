import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { CommandBarGroupChildItems, CommandBarGroupChildItemsTypedYAML } from "../../commonObjects/childItems/types"
import { BaseElement } from "../baseElement/types"
import { ContextMenuRules } from "./rules"

export interface ContextMenu extends BaseElement {
  itemType: "ContextMenu"
  displayImportance?: SE.DisplayImportance
  autofill?: boolean
  childItems: CommandBarGroupChildItems
}

export interface ContextMenuYAML {
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  Автозаполнение?: StringboolYAML
  Элементы?: CommandBarGroupChildItemsTypedYAML
}

export type ContextMenuEnterprise = EnterpriseType<typeof ContextMenuRules>
