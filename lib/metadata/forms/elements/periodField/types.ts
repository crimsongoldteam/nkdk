import { Border, BorderEnterprise, BorderXML } from "~/lib/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "../formField/types"

export interface PeriodField extends FormField {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  border?: Border
  borderColor?: Color
  font?: Font
  height?: number
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  userVisible?: UserVisible
  verticalStretch?: boolean
  width?: number
  events?: {
    onChange?: string
    selection?: string
  }
}

export interface PeriodFieldXML extends FormFieldXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  Border?: BorderXML
  BorderColor?: ColorXML
  Font?: FontXML
  Height?: number
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Width?: number
  Events?: EventsXML
}

export interface PeriodFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: boolean
  АвтоМаксимальнаяШирина?: boolean
  Рамка?: BorderEnterprise
  ЦветРамки?: ColorEnterprise
  Шрифт?: FontEnterprise
  Высота?: number
  РастягиватьПоГоризонтали?: boolean
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ПользовательскаяВидимость?: UserVisibleEnterprise
  РастягиватьПоВертикали?: boolean
  Ширина?: number
  События?: {
    ПриИзменении?: string
    Выбор?: string
  }
}
