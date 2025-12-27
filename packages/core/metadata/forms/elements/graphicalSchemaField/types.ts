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

export interface GraphicalSchemaField extends FormField {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  borderColor?: Color
  edit?: boolean
  height?: number
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  output?: SE.UseOutput
  userVisible?: UserVisible
  verticalStretch?: boolean
  width?: number
  events?: {
    onChange?: string
    selection?: string
    beforeWrite?: string
    beforePrint?: string
    afterWrite?: string
    onActivate?: string
  }
}

export interface GraphicalSchemaFieldXML extends FormFieldXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  BorderColor?: ColorXML
  Edit?: boolean
  Height?: number
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  Output?: SE.UseOutput
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Width?: number
  Events?: EventsXML
}

export interface GraphicalSchemaFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Вывод?: SE.UseOutputEnterprise
  Высота?: number
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  Редактирование?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  Ширина?: number
  События?: {
    ПриИзменении?: string
    Выбор?: string
    ПередЗаписью?: string
    ПередПечатью?: string
    ПослеЗаписи?: string
    ПриАктивизации?: string
  }
}
