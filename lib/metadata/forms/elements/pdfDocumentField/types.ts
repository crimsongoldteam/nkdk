import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "../formField/types"

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

export interface PdfDocumentFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: boolean
  АвтоМаксимальнаяШирина?: boolean
  ЦветРамки?: ColorEnterprise
  НомерТекущейСтраницы?: number
  Высота?: number
  РастягиватьПоГоризонтали?: boolean
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  Ориентация?: number
  Вывод?: SE.UseOutputEnterprise
  Масштаб?: number
  ИспользуемоеИмяФайла?: string
  ПользовательскаяВидимость?: UserVisibleEnterprise
  РастягиватьПоВертикали?: boolean
  ПоложениеСостоянияПросмотра?: SE.ViewStatusLocationEnterprise
  Ширина?: number
  События?: {
    ПриИзменении?: string
    НажатиеНаНавигационнойСсылке?: string
  }
}
