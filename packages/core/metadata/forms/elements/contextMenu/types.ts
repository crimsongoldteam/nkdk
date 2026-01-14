import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  ButtonGroupChildItems,
  ButtonGroupChildItemsEnterprise,
  ButtonGroupChildItemsXML,
} from "../../collections/buttonGroupChildItems/types"
import { BaseElementXML } from "../baseElement/types"

export interface ContextMenu {
  displayImportance?: SE.DisplayImportance
  autofill?: boolean
  childItems: ButtonGroupChildItems
}

export interface ContextMenuXML extends BaseElementXML {
  _DisplayImportance?: SE.DisplayImportance
  Autofill?: boolean
  ChildItems?: ButtonGroupChildItemsXML
}

export interface ContextMenuEnterprise {
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  Автозаполнение?: StringboolEnterprise
  ПодчиненныеЭлементы?: ButtonGroupChildItemsEnterprise
}
