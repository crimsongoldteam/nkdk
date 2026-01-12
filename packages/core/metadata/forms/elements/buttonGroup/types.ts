import { MetadataNameEnterprise } from "~/metadata/commonObjects/metadataName/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupPropsEnterprise, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
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

export interface ButtonGroupPropsEnterprise extends FormGroupPropsEnterprise {
  Отображение?: SE.ButtonGroupRepresentationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
}

export interface ButtonGroupEnterprise extends ButtonGroupPropsEnterprise {
  Тип: "ГруппаКнопок"
  Имя: MetadataNameEnterprise
  ПодчиненныеЭлементы?: ButtonGroupChildItemsEnterprise
}
