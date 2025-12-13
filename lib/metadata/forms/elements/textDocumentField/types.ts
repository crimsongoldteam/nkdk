import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "../formField/types"

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
  userVisible?: UserVisible
  verticalStretch?: boolean
  width?: number
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
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Width?: number
  Events?: EventsXML
}

export interface TextDocumentFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: boolean
  АвтоМаксимальнаяШирина?: boolean
  ЦветФона?: ColorEnterprise
  ЦветРамки?: ColorEnterprise
  Шрифт?: FontEnterprise
  Высота?: number
  РастягиватьПоГоризонтали?: boolean
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  Вывод?: SE.UseOutputEnterprise
  ВыделенныйТекст?: string
  ЦветТекста?: ColorEnterprise
  ПользовательскаяВидимость?: UserVisibleEnterprise
  РастягиватьПоВертикали?: boolean
  Ширина?: number
  События?: {
    ПриИзменении?: string
    ПередЗаписью?: string
    ПередПечатью?: string
    ПослеЗаписи?: string
  }
}
