import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "../formField/types"

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
  userVisible?: UserVisible
  verticalStretch?: boolean
  width?: number
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
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Width?: number
  Events?: EventsXML
}

export interface ProgressBarFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: boolean
  АвтоМаксимальнаяШирина?: boolean
  ЦветРамки?: ColorEnterprise
  Высота?: number
  РастягиватьПоГоризонтали?: boolean
  МаксимальнаяВысота?: number
  МаксимальноеЗначение?: number
  МаксимальнаяШирина?: number
  МинимальноеЗначение?: number
  Ориентация?: SE.FormItemOrientationEnterprise
  Отображение?: SE.ProgressBarSmoothingModeEnterprise
  ОтображатьПроценты?: boolean
  ПользовательскаяВидимость?: UserVisibleEnterprise
  РастягиватьПоВертикали?: boolean
  Ширина?: number
  События?: {
    ПриИзменении?: string
  }
}
