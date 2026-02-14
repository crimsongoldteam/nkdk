import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { UserVisibleEnterprise } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { CommandBarChildItems } from "../../collections/childItems/types"
import { BaseElement } from "../baseElement/types"

export interface AutoCommandBar extends BaseElement {
  itemType: "AutoCommandBar"
  autofill: boolean
  displayImportance?: SE.DisplayImportance
  horizontalAlign?: SE.ItemHorizontalLocation
  childItems: CommandBarChildItems
}

export interface AutoCommandBarEnterprise {
  Автозаполнение?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
}
