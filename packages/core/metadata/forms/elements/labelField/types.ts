import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { EventsXML } from "~/metadata/forms/events/types"

export interface LabelField extends FormField {
  elementType: "LabelField"
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
  userVisible?: UserVisible
  verticalStretch?: boolean
  width?: number
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
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Width?: number
  Events?: EventsXML
}

export interface LabelFieldPartialEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ВыделятьОтрицательные?: StringboolEnterprise
  Высота?: number
  Гиперссылка?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  Рамка?: BorderEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РежимПароля?: StringboolEnterprise
  Формат?: I8nTextEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
  События?: {
    ПриИзменении?: string
    Нажатие?: string
    ОбработкаНавигационнойСсылки?: string
  }
}

export interface LabelFieldTypedEnterprise extends LabelFieldPartialEnterprise {
  Тип: "ПолеНадписи"
}

// Для обратной совместимости
export type LabelFieldEnterprise = LabelFieldPartialEnterprise
