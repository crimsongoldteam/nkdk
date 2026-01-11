import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ChildItems, ChildItemsEnterprise, ChildItemsXML } from "../../collections/childItems/types"
import { BaseElementXML } from "../baseElement/types"

export interface ContextMenu {
  displayImportance?: SE.DisplayImportance
  autofill?: boolean
  childItems: ChildItems
}

export interface ContextMenuXML extends BaseElementXML {
  _DisplayImportance?: SE.DisplayImportance
  Autofill?: boolean
  ChildItems?: ChildItemsXML
}

export interface ContextMenuEnterprise {
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  Автозаполнение?: StringboolEnterprise
  ПодчиненныеЭлементы?: ChildItemsEnterprise
}
