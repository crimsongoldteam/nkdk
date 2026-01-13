import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupPartialEnterprise, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  ButtonGroupChildItem,
  ButtonGroupChildItemsEnterprise,
  ButtonGroupChildItemsXML,
} from "../../collections/buttonGroupChildItems/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface ButtonGroup extends FormGroup {
  extendedTooltip?: ExtendedTooltip
  representation?: SE.ButtonGroupRepresentation
  userVisible?: UserVisible
  childItems: ButtonGroupChildItem[]
}

export interface ButtonGroupXML extends FormGroupXML {
  ExtendedTooltip: ExtendedTooltipXML
  Representation?: SE.ButtonGroupRepresentation
  UserVisible?: UserVisibleXML
  ChildItems?: ButtonGroupChildItemsXML
}

export interface ButtonGroupPartialEnterprise extends FormGroupPartialEnterprise {
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  Отображение?: SE.ButtonGroupRepresentationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПодчиненныеЭлементы?: ButtonGroupChildItemsEnterprise
}

export interface ButtonGroupTypedEnterprise extends ButtonGroupPartialEnterprise {
  Тип: "ГруппаКнопок"
}
