import { StringboolEnterprise } from "~/packages/core/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/packages/core/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/packages/core/metadata/commonObjects/font/types"
import {
  UserVisible,
  UserVisibleEnterprise,
  UserVisibleXML,
} from "~/packages/core/metadata/commonObjects/userVisible/types"
import {
  FormItemAddition,
  FormItemAdditionEnterprise,
  FormItemAdditionXML,
} from "~/packages/core/metadata/forms/elements/formItemAddition/types"

export interface SearchStringAddition extends FormItemAddition {
  backColor?: Color
  borderColor?: Color
  font?: Font
  horizontalStretch?: boolean
  textColor?: Color
  userVisible?: UserVisible
  width?: number
}

export interface SearchStringAdditionXML extends FormItemAdditionXML {
  BackColor?: ColorXML
  BorderColor?: ColorXML
  Font?: FontXML
  HorizontalStretch?: boolean
  TextColor?: ColorXML
  UserVisible?: UserVisibleXML
  Width?: number
}

export interface SearchStringAdditionEnterprise extends FormItemAdditionEnterprise {
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
}
