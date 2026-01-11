import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { UserVisibleEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ButtonGroupChildItem, ButtonGroupChildItemsXML } from "../../collections/buttonGroupChildItems/types"
import { BaseElementXML } from "../baseElement/types"

export interface AutoCommandBar {
  elementType: FormElementType
  autofill: boolean
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

export interface AutoCommandBarEnterprise {
  Автозаполнение?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
}
