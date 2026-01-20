import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  CommandBarChildItems,
  CommandBarChildItemsTypedEnterprise,
  CommandBarChildItemsXML,
} from "../../collections/commandBarChildItems/types"
import { BaseElementXML } from "../baseElement/types"

export interface ContextMenu {
  displayImportance?: SE.DisplayImportance
  autofill?: boolean
  childItems: CommandBarChildItems
}

export interface ContextMenuXML extends BaseElementXML {
  _DisplayImportance?: SE.DisplayImportance
  Autofill?: boolean
  ChildItems?: CommandBarChildItemsXML
}

export interface ContextMenuEnterprise {
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  Автозаполнение?: StringboolEnterprise
  ПодчиненныеЭлементы?: CommandBarChildItemsTypedEnterprise
}
