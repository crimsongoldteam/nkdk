import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface PdfDocumentField extends FormField {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  borderColor?: Color
  currentPageNumber?: number
  height?: number
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  orientation?: number
  output?: SE.UseOutput
  scale?: number
  usedFileName?: string
  userVisible?: UserVisible
  verticalStretch?: boolean
  viewStatusLocation?: SE.ViewStatusLocation
  width?: number
  events?: {
    onChange?: string
    uRLClick?: string
  }
}

export interface PdfDocumentFieldXML extends FormFieldXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  BorderColor?: ColorXML
  CurrentPageNumber?: number
  Height?: number
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  Orientation?: number
  Output?: SE.UseOutput
  Scale?: number
  UsedFileName?: string
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  ViewStatusLocation?: SE.ViewStatusLocation
  Width?: number
  Events?: EventsXML
}

export interface PdfDocumentFieldPartialEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Вывод?: SE.UseOutputEnterprise
  Высота?: number
  ИспользуемоеИмяФайла?: string
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  Масштаб?: number
  НомерТекущейСтраницы?: number
  Ориентация?: number
  ПоложениеСостоянияПросмотра?: SE.ViewStatusLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  Ширина?: number
  События?: {
    ПриИзменении?: string
    НажатиеНаНавигационнойСсылке?: string
  }
}

export interface PdfDocumentFieldTypedEnterprise extends PdfDocumentFieldPartialEnterprise {
  Тип: "ПолеPDFДокумента"
}

// Для обратной совместимости
export type PdfDocumentFieldEnterprise = PdfDocumentFieldPartialEnterprise

export type PdfDocumentFieldTypes = PdfDocumentField | PdfDocumentFieldEnterprise | PdfDocumentFieldXML
