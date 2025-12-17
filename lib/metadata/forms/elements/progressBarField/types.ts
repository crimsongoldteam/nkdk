import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/lib/metadata/forms/elements/formField/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface ProgressBarField extends FormField {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  borderColor?: Color
  height?: number
  horizontalStretch?: boolean
  maxHeight?: number
  maxValue?: number
  maxWidth?: number
  minValue?: number
  orientation?: SE.FormItemOrientation
  representation?: SE.ProgressBarSmoothingMode
  showPercent?: boolean
  verticalStretch?: boolean
  width?: number
  userVisible?: UserVisible
  events?: {
    onChange?: string
  }
}

export interface ProgressBarFieldXML extends FormFieldXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  BorderColor?: ColorXML
  Height?: number
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxValue?: number
  MaxWidth?: number
  MinValue?: number
  Orientation?: SE.FormItemOrientation
  Representation?: SE.ProgressBarSmoothingMode
  ShowPercent?: boolean
  VerticalStretch?: boolean
  Width?: number
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface ProgressBarFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  Высота?: number
  РастягиватьПоГоризонтали?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальноеЗначение?: number
  МаксимальнаяШирина?: number
  МинимальноеЗначение?: number
  Ориентация?: SE.FormItemOrientationEnterprise
  Отображение?: SE.ProgressBarSmoothingModeEnterprise
  ОтображатьПроценты?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  События?: {
    ПриИзменении?: string
  }
}
