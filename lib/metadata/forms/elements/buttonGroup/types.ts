import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "../formGroup/types"

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
  ПользовательскаяВидимость?: UserVisibleEnterprise
}
