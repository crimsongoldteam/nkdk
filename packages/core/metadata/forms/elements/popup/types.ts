import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface Popup extends FormGroup {
  backColor?: Color
  borderColor?: Color
  picture?: Picture
  representation?: SE.ButtonRepresentation
  shape?: SE.ButtonShape
  shapeRepresentation?: SE.ButtonShapeRepresentation
  userVisible?: UserVisible
}

export interface PopupXML extends FormGroupXML {
  BackColor?: ColorXML
  BorderColor?: ColorXML
  Picture?: PictureXML
  Representation?: SE.ButtonRepresentation
  Shape?: SE.ButtonShape
  ShapeRepresentation?: SE.ButtonShapeRepresentation
  UserVisible?: UserVisibleXML
}

export interface PopupEnterprise extends FormGroupEnterprise {
  Картинка?: PictureEnterprise
  Отображение?: SE.ButtonRepresentationEnterprise
  ОтображениеФигуры?: SE.ButtonShapeRepresentationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  Фигура?: SE.ButtonShapeEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветФона?: ColorEnterprise
}
