import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface PictureField extends FormField {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  border?: Border
  borderColor?: Color
  enableDrag?: boolean
  enableStartDrag?: boolean
  fileDragMode?: SE.FileDragMode
  font?: Font
  height?: number
  horizontalStretch?: boolean
  hyperlink?: boolean
  maxHeight?: number
  maxWidth?: number
  nonselectedPictureText?: string
  pictureSize?: SE.PictureSize
  scale?: number
  textColor?: Color
  userVisible?: UserVisible
  valuesPicture?: Picture
  verticalStretch?: boolean
  width?: number
  zoomable?: boolean
  events?: {
    onChange?: string
    click?: string
    dragStart?: string
    dragEnd?: string
    drag?: string
    dragCheck?: string
  }
}

export interface PictureFieldXML extends FormFieldXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  Border?: BorderXML
  BorderColor?: ColorXML
  EnableDrag?: boolean
  EnableStartDrag?: boolean
  FileDragMode?: SE.FileDragMode
  Font?: FontXML
  Height?: number
  HorizontalStretch?: boolean
  Hyperlink?: boolean
  MaxHeight?: number
  MaxWidth?: number
  NonselectedPictureText?: string
  PictureSize?: SE.PictureSize
  Scale?: number
  TextColor?: ColorXML
  UserVisible?: UserVisibleXML
  ValuesPicture?: PictureXML
  VerticalStretch?: boolean
  Width?: number
  Zoomable?: boolean
  Events?: EventsXML
}

export interface PictureFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Высота?: number
  Гиперссылка?: StringboolEnterprise
  КартинкаЗначений?: PictureEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  Масштаб?: number
  Масштабировать?: StringboolEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РазмерКартинки?: SE.PictureSizeEnterprise
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  Рамка?: BorderEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  СпособПеретаскиванияФайлов?: SE.FileDragModeEnterprise
  ТекстНевыбраннойКартинки?: string
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
  События?: {
    ПриИзменении?: string
    Нажатие?: string
    НачалоПеретаскивания?: string
    ОкончаниеПеретаскивания?: string
    Перетаскивание?: string
    ПроверкаПеретаскивания?: string
  }
}
