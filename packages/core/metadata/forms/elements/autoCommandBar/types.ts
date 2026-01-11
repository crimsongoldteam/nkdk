import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { UserVisibleEnterprise } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  ButtonGroupChildItem,
  ButtonGroupChildItemsEnterprise,
  ButtonGroupChildItemsXML,
} from "../../collections/buttonGroupChildItems/types"
import { BaseElement, BaseElementEnterprise, BaseElementXML } from "../baseElement/types"

export interface AutoCommandBar extends BaseElement {
  autofill?: boolean
  displayImportance?: SE.DisplayImportance
  horizontalAlign?: SE.ItemHorizontalLocation
  childItems: ButtonGroupChildItem[]
}

export interface AutoCommandBarXML extends BaseElementXML {
  Autofill?: boolean
  _DisplayImportance?: SE.DisplayImportance
  HorizontalAlign?: SE.ItemHorizontalLocation
  ChildItems?: ButtonGroupChildItemsXML
}

export interface AutoCommandBarEnterprise extends BaseElementEnterprise {
  Автозаполнение?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПодчиненныеЭлементы?: ButtonGroupChildItemsEnterprise
}
