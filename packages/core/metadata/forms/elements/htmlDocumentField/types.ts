import { StringboolEnterprise } from "~/packages/core/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/packages/core/metadata/commonObjects/color/types"
import {
  UserVisible,
  UserVisibleEnterprise,
  UserVisibleXML,
} from "~/packages/core/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/packages/core/metadata/forms/elements/formField/types"
import { EventsXML } from "~/packages/core/metadata/forms/events/types"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

export interface HTMLDocumentField extends FormField {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  borderColor?: Color
  height?: number
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  output?: SE.UseOutput
  userAgentInformation?: string
  userVisible?: UserVisible
  verticalStretch?: boolean
  width?: number
  events?: {
    onChange?: string
    documentComplete?: string
    beforeWrite?: string
    beforePrint?: string
    afterWrite?: string
    onClick?: string
  }
}

export interface HTMLDocumentFieldXML extends FormFieldXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  BorderColor?: ColorXML
  Height?: number
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  Output?: SE.UseOutput
  UserAgentInformation?: string
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Width?: number
  Events?: EventsXML
}

export interface HTMLDocumentFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Вывод?: SE.UseOutputEnterprise
  Высота?: number
  ИнформацияПрограммыПросмотра?: string
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  Ширина?: number
  События?: {
    ПриИзменении?: string
    ДокументСформирован?: string
    ПередЗаписью?: string
    ПередПечатью?: string
    ПослеЗаписи?: string
    ПриНажатии?: string
  }
}
