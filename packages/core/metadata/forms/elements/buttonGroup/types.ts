import {
  UserVisible,
  UserVisibleEnterprise,
  UserVisibleXML,
} from "~/packages/core/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/packages/core/metadata/forms/elements/formGroup/types"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

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
