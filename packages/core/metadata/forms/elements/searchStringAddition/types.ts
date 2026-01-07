import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import {
  FormItemAddition,
  FormItemAdditionEnterprise,
  FormItemAdditionXML,
} from "~/metadata/forms/elements/formItemAddition/types"

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
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
}
