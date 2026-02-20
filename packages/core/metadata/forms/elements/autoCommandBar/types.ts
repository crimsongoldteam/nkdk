import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
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

export interface AutoCommandBarYAML {
  Автозаполнение?: StringboolYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
}
