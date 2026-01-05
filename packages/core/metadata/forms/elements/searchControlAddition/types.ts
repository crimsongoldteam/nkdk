import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import {
  FormItemAddition,
  FormItemAdditionEnterprise,
  FormItemAdditionXML,
} from "~/metadata/forms/elements/formItemAddition/types"

export interface SearchControlAddition extends FormItemAddition {
  autoMaxWidth?: boolean
  backColor?: Color
  borderColor?: Color
  font?: Font
  horizontalStretch?: boolean
  maxWidth?: number
  textColor?: Color
  userVisible?: UserVisible
  width?: number
}

export interface SearchControlAdditionXML extends FormItemAdditionXML {
  AutoMaxWidth?: boolean
  BackColor?: ColorXML
  BorderColor?: ColorXML
  Font?: FontXML
  HorizontalStretch?: boolean
  MaxWidth?: number
  TextColor?: ColorXML
  UserVisible?: UserVisibleXML
  Width?: number
}

export interface SearchControlAdditionEnterprise extends FormItemAdditionEnterprise {
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  МаксимальнаяШирина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
}
