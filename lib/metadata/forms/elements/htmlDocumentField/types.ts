import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import {
  UserVisible,
  UserVisibleAllowEnterprise,
  UserVisibleDenyEnterprise,
  UserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/lib/metadata/forms/elements/formField/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
  verticalStretch?: boolean
  width?: number
  userVisible?: UserVisible
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
  VerticalStretch?: boolean
  Width?: number
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface HTMLDocumentFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  Высота?: number
  РастягиватьПоГоризонтали?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  Вывод?: SE.UseOutputEnterprise
  ИнформацияПрограммыПросмотра?: string
  РастягиватьПоВертикали?: StringboolEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
  События?: {
    ПриИзменении?: string
    ДокументСформирован?: string
    ПередЗаписью?: string
    ПередПечатью?: string
    ПослеЗаписи?: string
    ПриНажатии?: string
  }
}
