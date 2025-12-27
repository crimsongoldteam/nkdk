import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import {
  FormItemAddition,
  FormItemAdditionEnterprise,
  FormItemAdditionXML,
} from "~/metadata/forms/elements/formItemAddition/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface ViewStatusAddition extends FormItemAddition {
  autoMaxWidth?: boolean
  backColor?: Color
  border?: Border
  borderColor?: Color
  buttonsBackColor?: Color
  font?: Font
  horizontalAlign?: SE.ItemHorizontalLocation
  horizontalStretch?: boolean
  maxWidth?: number
  textColor?: Color
  titleFont?: Font
  titleTextColor?: Color
  userVisible?: UserVisible
  width?: number
}

export interface ViewStatusAdditionXML extends FormItemAdditionXML {
  AutoMaxWidth?: boolean
  BackColor?: ColorXML
  Border?: BorderXML
  BorderColor?: ColorXML
  ButtonsBackColor?: ColorXML
  Font?: FontXML
  HorizontalAlign?: SE.ItemHorizontalLocation
  HorizontalStretch?: boolean
  MaxWidth?: number
  TextColor?: ColorXML
  TitleFont?: FontXML
  TitleTextColor?: ColorXML
  UserVisible?: UserVisibleXML
  Width?: number
}

export interface ViewStatusAdditionEnterprise extends FormItemAdditionEnterprise {
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  МаксимальнаяШирина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  Рамка?: BorderEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  ЦветФонаКнопок?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
  ШрифтЗаголовка?: FontEnterprise
}
