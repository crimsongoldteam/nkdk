import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { CommandBarGroupChildItems, CommandBarGroupChildItemsTypedYAML } from "../../commonObjects/childItems/types"
import { BaseElement } from "../baseElement/types"

export interface ContextMenu extends BaseElement {
  itemType: "ContextMenu"
  displayImportance?: SE.DisplayImportance
  autofill?: boolean
  childItems: CommandBarGroupChildItems
}

export interface ContextMenuYAML {
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  Автозаполнение?: StringboolYAML
  ПодчиненныеЭлементы?: CommandBarGroupChildItemsTypedYAML
}

// export type ContextMenuEnterprise = EnterpriseType<typeof ContextMenuRules>
