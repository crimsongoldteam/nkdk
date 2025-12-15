import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/lib/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import {
  UserVisible,
  UserVisibleAllowEnterprise,
  UserVisibleDenyEnterprise,
  UserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/lib/metadata/forms/elements/formField/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"

export interface LabelField extends FormField {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  backColor?: Color
  border?: Border
  borderColor?: Color
  font?: Font
  format?: I8nText
  height?: number
  horizontalStretch?: boolean
  hyperlink?: boolean
  markNegatives?: boolean
  maxHeight?: number
  maxWidth?: number
  passwordMode?: boolean
  textColor?: Color
  verticalStretch?: boolean
  width?: number
  userVisible?: UserVisible
  events?: {
    onChange?: string
    click?: string
    uRLProcessing?: string
  }
}

export interface LabelFieldXML extends FormFieldXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  BackColor?: ColorXML
  Border?: BorderXML
  BorderColor?: ColorXML
  Font?: FontXML
  Format?: I8nTextXML
  Height?: number
  HorizontalStretch?: boolean
  Hyperlink?: boolean
  MarkNegatives?: boolean
  MaxHeight?: number
  MaxWidth?: number
  PasswordMode?: boolean
  TextColor?: ColorXML
  VerticalStretch?: boolean
  Width?: number
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface LabelFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ЦветФона?: ColorEnterprise
  Рамка?: BorderEnterprise
  ЦветРамки?: ColorEnterprise
  Шрифт?: FontEnterprise
  Формат?: I8nTextEnterprise
  Высота?: number
  РастягиватьПоГоризонтали?: StringboolEnterprise
  Гиперссылка?: StringboolEnterprise
  ВыделятьОтрицательные?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  РежимПароля?: StringboolEnterprise
  ЦветТекста?: ColorEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
  События?: {
    ПриИзменении?: string
    Нажатие?: string
    ОбработкаНавигационнойСсылки?: string
  }
}
