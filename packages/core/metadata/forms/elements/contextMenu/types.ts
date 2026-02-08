import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { CommandBarGroupChildItems, CommandBarGroupChildItemsTypedEnterprise } from "../../collections/childItems/types"
import { BaseElement } from "../baseElement/types"

export interface ContextMenu extends BaseElement {
  elementType: "ContextMenu"
  displayImportance?: SE.DisplayImportance
  autofill?: boolean
  childItems: CommandBarGroupChildItems
}

export interface ContextMenuEnterprise {
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  Автозаполнение?: StringboolEnterprise
  ПодчиненныеЭлементы?: CommandBarGroupChildItemsTypedEnterprise
}
