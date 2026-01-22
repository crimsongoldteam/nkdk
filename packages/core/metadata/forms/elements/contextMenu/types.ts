import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  CommandBarGroupChildItems,
  CommandBarGroupChildItemsTypedEnterprise,
  CommandBarGroupChildItemsXML,
} from "../../collections/commandBarChildItems/types"
import { BaseElementXML } from "../baseElement/types"

export interface ContextMenu {
  displayImportance?: SE.DisplayImportance
  autofill?: boolean
  childItems: CommandBarGroupChildItems
}

export interface ContextMenuXML extends BaseElementXML {
  _DisplayImportance?: SE.DisplayImportance
  Autofill?: boolean
  ChildItems?: CommandBarGroupChildItemsXML
}

export interface ContextMenuEnterprise {
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  Автозаполнение?: StringboolEnterprise
  ПодчиненныеЭлементы?: CommandBarGroupChildItemsTypedEnterprise
}
