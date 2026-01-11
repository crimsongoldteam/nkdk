import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  ButtonGroupChildItem,
  ButtonGroupChildItemsEnterprise,
  ButtonGroupChildItemsXML,
} from "../../collections/buttonGroupChildItems/types"

export interface ButtonGroup extends FormGroup {
  representation?: SE.ButtonGroupRepresentation
  userVisible?: UserVisible
  childItems: ButtonGroupChildItem[]
}

export interface ButtonGroupXML extends FormGroupXML {
  Representation?: SE.ButtonGroupRepresentation
  UserVisible?: UserVisibleXML
  ПодчиненныеЭлементы?: ButtonGroupChildItemsXML
}

export interface ButtonGroupEnterprise extends FormGroupEnterprise {
  Тип: "ГруппаКнопок"
  Отображение?: SE.ButtonGroupRepresentationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПодчиненныеЭлементы?: ButtonGroupChildItemsEnterprise
}
