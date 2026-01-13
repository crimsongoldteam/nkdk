import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupPartialEnterprise, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  ButtonGroupChildItem,
  ButtonGroupChildItemsEnterprise,
  ButtonGroupChildItemsXML,
} from "../../collections/buttonGroupChildItems/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface Popup extends FormGroup {
  extendedTooltip?: ExtendedTooltip
  backColor?: Color
  borderColor?: Color
  picture?: Picture
  representation?: SE.ButtonRepresentation
  shape?: SE.ButtonShape
  shapeRepresentation?: SE.ButtonShapeRepresentation
  userVisible?: UserVisible
  childItems: ButtonGroupChildItem[]
}

export interface PopupXML extends FormGroupXML {
  BackColor?: ColorXML
  BorderColor?: ColorXML
  Picture?: PictureXML
  Representation?: SE.ButtonRepresentation
  Shape?: SE.ButtonShape
  ShapeRepresentation?: SE.ButtonShapeRepresentation
  UserVisible?: UserVisibleXML
  ExtendedTooltip: ExtendedTooltipXML
  ChildItems?: ButtonGroupChildItemsXML
}

export interface PopupPartialEnterprise extends FormGroupPartialEnterprise {
  Картинка?: PictureEnterprise
  Отображение?: SE.ButtonRepresentationEnterprise
  ОтображениеФигуры?: SE.ButtonShapeRepresentationEnterprise
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  Фигура?: SE.ButtonShapeEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  ПодчиненныеЭлементы?: ButtonGroupChildItemsEnterprise
}

export interface PopupTypedEnterprise extends PopupPartialEnterprise {
  Тип: "Подменю"
}
