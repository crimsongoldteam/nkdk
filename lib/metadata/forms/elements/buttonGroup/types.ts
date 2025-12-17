import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/lib/metadata/forms/elements/formGroup/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface ButtonGroup extends FormGroup {
  representation?: SE.ButtonGroupRepresentation
  userVisible?: UserVisible
}

export interface ButtonGroupXML extends FormGroupXML {
  Representation?: SE.ButtonGroupRepresentation
  UserVisible?: UserVisibleXML
}

export interface ButtonGroupEnterprise extends FormGroupEnterprise {
  Отображение?: SE.ButtonGroupRepresentationEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
}
