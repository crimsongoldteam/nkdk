import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import {
  FormGroup,
  FormGroupPartialEnterprise,
  FormGroupXML,
} from "~/metadata/forms/elements/formGroup/types"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  ButtonGroupChildItem,
  ButtonGroupChildItemsEnterprise,
  ButtonGroupChildItemsXML,
} from "../../collections/buttonGroupChildItems/types"

export interface CommandBar extends FormGroup {
  autofill?: boolean
  displayImportance?: SE.DisplayImportance
  horizontalAlign?: SE.ItemHorizontalLocation
  userVisible?: UserVisible
  childItems: ButtonGroupChildItem[]
}

export interface CommandBarXML extends FormGroupXML {
  Autofill?: boolean
  _DisplayImportance?: SE.DisplayImportance
  HorizontalAlign?: SE.ItemHorizontalLocation
  UserVisible?: UserVisibleXML
  ПодчиненныеЭлементы?: ButtonGroupChildItemsXML
}

export interface CommandBarPartialEnterprise extends FormGroupPartialEnterprise {
  Автозаполнение?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПодчиненныеЭлементы?: ButtonGroupChildItemsEnterprise
}

export interface CommandBarTypedEnterprise extends CommandBarPartialEnterprise {
  Тип: "КоманднаяПанель"
}

export interface CommandBarEnterprise extends FormGroupPartialEnterprise {
  Автозаполнение?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПодчиненныеЭлементы?: ButtonGroupChildItemsEnterprise
}
