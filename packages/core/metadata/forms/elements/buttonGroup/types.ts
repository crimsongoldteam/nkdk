import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
import * as SE from "~/metadata/systemEnumerations/types"

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
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
}
