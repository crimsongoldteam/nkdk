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

export interface SearchStringAddition extends FormItemAddition {
  backColor?: Color
  borderColor?: Color
  font?: Font
  horizontalStretch?: boolean
  textColor?: Color
  width?: number
  userVisible?: UserVisible
}

export interface SearchStringAdditionXML extends FormItemAdditionXML {
  BackColor?: ColorXML
  BorderColor?: ColorXML
  Font?: FontXML
  HorizontalStretch?: boolean
  TextColor?: ColorXML
  Width?: number
  UserVisible?: UserVisibleXML
}

export interface SearchStringAdditionEnterprise extends FormItemAdditionEnterprise {
  ЦветФона?: ColorEnterprise
  ЦветРамки?: ColorEnterprise
  Шрифт?: FontEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  ЦветТекста?: ColorEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
}
