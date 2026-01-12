import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { EventsXML } from "~/metadata/forms/events/types"

export interface DendrogramField extends FormField {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
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
    detailProcessing?: string
  }
}

export interface DendrogramFieldXML extends FormFieldXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  Height?: number
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Width?: number
  Events?: EventsXML
}

export interface DendrogramFieldPartialEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Высота?: number
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  Ширина?: number
  События?: {
    ПриИзменении?: string
    Выбор?: string
    ОбработкаРасшифровки?: string
  }
}

export interface DendrogramFieldTypedEnterprise extends DendrogramFieldPartialEnterprise {
  Тип: "ПолеДендрограммы"
}

// Для обратной совместимости
export type DendrogramFieldEnterprise = DendrogramFieldPartialEnterprise
