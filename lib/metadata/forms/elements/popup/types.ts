import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Picture, PictureEnterprise, PictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import {
  UserVisible,
  UserVisibleAllowEnterprise,
  UserVisibleDenyEnterprise,
  UserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/lib/metadata/forms/elements/formGroup/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
  ЦветФона?: ColorEnterprise
  ЦветРамки?: ColorEnterprise
  Картинка?: PictureEnterprise
  Отображение?: SE.ButtonRepresentationEnterprise
  Фигура?: SE.ButtonShapeEnterprise
  ОтображениеФигуры?: SE.ButtonShapeRepresentationEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
}
