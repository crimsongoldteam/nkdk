import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
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
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface TextDocumentField extends FormField {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  backColor?: Color
  borderColor?: Color
  font?: Font
  height?: number
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  output?: SE.UseOutput
  selectedText?: string
  textColor?: Color
  verticalStretch?: boolean
  width?: number
  userVisible?: UserVisible
  events?: {
    onChange?: string
    beforeWrite?: string
    beforePrint?: string
    afterWrite?: string
  }
}

export interface TextDocumentFieldXML extends FormFieldXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  BackColor?: ColorXML
  BorderColor?: ColorXML
  Font?: FontXML
  Height?: number
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  Output?: SE.UseOutput
  SelectedText?: string
  TextColor?: ColorXML
  VerticalStretch?: boolean
  Width?: number
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface TextDocumentFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ЦветФона?: ColorEnterprise
  ЦветРамки?: ColorEnterprise
  Шрифт?: FontEnterprise
  Высота?: number
  РастягиватьПоГоризонтали?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  Вывод?: SE.UseOutputEnterprise
  ВыделенныйТекст?: string
  ЦветТекста?: ColorEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
  События?: {
    ПриИзменении?: string
    ПередЗаписью?: string
    ПередПечатью?: string
    ПослеЗаписи?: string
  }
}
