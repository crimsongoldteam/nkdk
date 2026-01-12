import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupPropsEnterprise, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ButtonGroupChildItem, ButtonGroupChildItemsXML } from "../../collections/buttonGroupChildItems/types"

export interface Popup extends FormGroup {
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
  ПодчиненныеЭлементы?: ButtonGroupChildItemsXML
}

export interface PopupPartialEnterprise extends FormGroupPropsEnterprise {
  Картинка?: PictureEnterprise
  Отображение?: SE.ButtonRepresentationEnterprise
  ОтображениеФигуры?: SE.ButtonShapeRepresentationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  Фигура?: SE.ButtonShapeEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  ПодчиненныеЭлементы?: ButtonGroupChildItem
}

export interface PopupTypedEnterprise extends PopupPartialEnterprise {
  Тип: "Подменю"
}

/**
 * @deprecated Use PopupPartialEnterprise or PopupTypedEnterprise instead
 */
export type PopupEnterprise = PopupTypedEnterprise
