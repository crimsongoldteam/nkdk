import { Border, BorderEnterprise, BorderXML } from "~/lib/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { FormItemAddition, FormItemAdditionEnterprise, FormItemAdditionXML } from "../formItemAddition/types"

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
  АвтоМаксимальнаяШирина?: boolean
  ЦветФона?: ColorEnterprise
  Рамка?: BorderEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветФонаКнопок?: ColorEnterprise
  Шрифт?: FontEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  РастягиватьПоГоризонтали?: boolean
  МаксимальнаяШирина?: number
  ЦветТекста?: ColorEnterprise
  ШрифтЗаголовка?: FontEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  ПользовательскаяВидимость?: UserVisibleEnterprise
  Ширина?: number
}
