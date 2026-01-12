import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"

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

export interface GraphicalSchemaFieldPartialEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Вывод?: SE.UseOutputEnterprise
  Высота?: number
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
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

export interface GraphicalSchemaFieldTypedEnterprise extends GraphicalSchemaFieldPartialEnterprise {
  Тип: "ПолеГрафическойСхемы"
}

// Для обратной совместимости
export type GraphicalSchemaFieldEnterprise = GraphicalSchemaFieldPartialEnterprise
