import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/lib/metadata/commonObjects/border/types"
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
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
  width?: number
  userVisible?: UserVisible
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
  Width?: number
  UserVisible?: UserVisibleXML
}

export interface ViewStatusAdditionEnterprise extends FormItemAdditionEnterprise {
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ЦветФона?: ColorEnterprise
  Рамка?: BorderEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветФонаКнопок?: ColorEnterprise
  Шрифт?: FontEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  МаксимальнаяШирина?: number
  ЦветТекста?: ColorEnterprise
  ШрифтЗаголовка?: FontEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
}
