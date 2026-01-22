import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { UserVisibleEnterprise } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { CommandBarChildItems, CommandBarChildItemsXML } from "../../collections/childItems/types"
import { BaseElementXML } from "../baseElement/types"

export interface AutoCommandBar {
  autofill: boolean
  displayImportance?: SE.DisplayImportance
  horizontalAlign?: SE.ItemHorizontalLocation
  childItems: CommandBarChildItems
}

export interface AutoCommandBarXML extends BaseElementXML {
  Autofill?: boolean
  _DisplayImportance?: SE.DisplayImportance
  HorizontalAlign?: SE.ItemHorizontalLocation
  ChildItems?: CommandBarChildItemsXML
}

export interface AutoCommandBarEnterprise {
  Автозаполнение?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
}
