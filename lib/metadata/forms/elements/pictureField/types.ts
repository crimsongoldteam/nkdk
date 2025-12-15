import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/lib/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types"
import { Picture, PictureEnterprise, PictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import {
  UserVisible,
  UserVisibleAllowEnterprise,
  UserVisibleDenyEnterprise,
  UserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/lib/metadata/forms/elements/formField/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
  valuesPicture?: Picture
  verticalStretch?: boolean
  width?: number
  zoomable?: boolean
  userVisible?: UserVisible
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
  ValuesPicture?: PictureXML
  VerticalStretch?: boolean
  Width?: number
  Zoomable?: boolean
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface PictureFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Рамка?: BorderEnterprise
  ЦветРамки?: ColorEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  СпособПеретаскиванияФайлов?: SE.FileDragModeEnterprise
  Шрифт?: FontEnterprise
  Высота?: number
  РастягиватьПоГоризонтали?: StringboolEnterprise
  Гиперссылка?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ТекстНевыбраннойКартинки?: string
  РазмерКартинки?: SE.PictureSizeEnterprise
  Масштаб?: number
  ЦветТекста?: ColorEnterprise
  КартинкаЗначений?: PictureEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  Ширина?: number
  Масштабировать?: StringboolEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
  События?: {
    ПриИзменении?: string
    Нажатие?: string
    НачалоПеретаскивания?: string
    ОкончаниеПеретаскивания?: string
    Перетаскивание?: string
    ПроверкаПеретаскивания?: string
  }
}
