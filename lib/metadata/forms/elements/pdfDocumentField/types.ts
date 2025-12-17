import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/lib/metadata/forms/elements/formField/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
  verticalStretch?: boolean
  viewStatusLocation?: SE.ViewStatusLocation
  width?: number
  userVisible?: UserVisible
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
  VerticalStretch?: boolean
  ViewStatusLocation?: SE.ViewStatusLocation
  Width?: number
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface PdfDocumentFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  НомерТекущейСтраницы?: number
  Высота?: number
  РастягиватьПоГоризонтали?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  Ориентация?: number
  Вывод?: SE.UseOutputEnterprise
  Масштаб?: number
  ИспользуемоеИмяФайла?: string
  РастягиватьПоВертикали?: StringboolEnterprise
  ПоложениеСостоянияПросмотра?: SE.ViewStatusLocationEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  События?: {
    ПриИзменении?: string
    НажатиеНаНавигационнойСсылке?: string
  }
}
