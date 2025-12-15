import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types"
import {
  UserVisible,
  UserVisibleAllowEnterprise,
  UserVisibleDenyEnterprise,
  UserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import {
  FormItemAddition,
  FormItemAdditionEnterprise,
  FormItemAdditionXML,
} from "~/lib/metadata/forms/elements/formItemAddition/types"

export interface SearchControlAddition extends FormItemAddition {
  autoMaxWidth?: boolean
  backColor?: Color
  borderColor?: Color
  font?: Font
  horizontalStretch?: boolean
  maxWidth?: number
  textColor?: Color
  width?: number
  userVisible?: UserVisible
}

export interface SearchControlAdditionXML extends FormItemAdditionXML {
  AutoMaxWidth?: boolean
  BackColor?: ColorXML
  BorderColor?: ColorXML
  Font?: FontXML
  HorizontalStretch?: boolean
  MaxWidth?: number
  TextColor?: ColorXML
  Width?: number
  UserVisible?: UserVisibleXML
}

export interface SearchControlAdditionEnterprise extends FormItemAdditionEnterprise {
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ЦветФона?: ColorEnterprise
  ЦветРамки?: ColorEnterprise
  Шрифт?: FontEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  МаксимальнаяШирина?: number
  ЦветТекста?: ColorEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
}
