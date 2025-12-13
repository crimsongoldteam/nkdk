import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "../formGroup/types"

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
  Автозаполнение?: boolean
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  ПользовательскаяВидимость?: UserVisibleEnterprise
}
