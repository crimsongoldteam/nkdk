import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/lib/metadata/forms/elements/formGroup/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface CommandBar extends FormGroup {
  autofill?: boolean
  displayImportance?: SE.DisplayImportance
  horizontalAlign?: SE.ItemHorizontalLocation
  userVisible?: UserVisible
}

export interface CommandBarXML extends FormGroupXML {
  Autofill?: boolean
  _DisplayImportance?: SE.DisplayImportance
  HorizontalAlign?: SE.ItemHorizontalLocation
  UserVisible?: UserVisibleXML
}

export interface CommandBarEnterprise extends FormGroupEnterprise {
  Автозаполнение?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
}
