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
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/lib/metadata/forms/elements/formField/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"

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
  verticalStretch?: boolean
  width?: number
  userVisible?: UserVisible
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
  VerticalStretch?: boolean
  Width?: number
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface PeriodFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Рамка?: BorderEnterprise
  ЦветРамки?: ColorEnterprise
  Шрифт?: FontEnterprise
  Высота?: number
  РастягиватьПоГоризонтали?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  РастягиватьПоВертикали?: StringboolEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
  События?: {
    ПриИзменении?: string
    Выбор?: string
  }
}
