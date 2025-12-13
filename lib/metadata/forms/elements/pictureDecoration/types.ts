import { Border, BorderEnterprise, BorderXML } from "~/lib/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Picture, PictureEnterprise, PictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { FormDecoration, FormDecorationEnterprise, FormDecorationXML } from "../formDecoration/types"

export interface PictureDecoration extends FormDecoration {
  border?: Border
  borderColor?: Color
  enableDrag?: boolean
  enableStartDrag?: boolean
  fileDragMode?: SE.FileDragMode
  hyperlink?: boolean
  nonselectedPictureText?: string
  picture?: Picture
  pictureSize?: SE.PictureSize
  scale?: number
  userVisible?: UserVisible
  zoomable?: boolean
  events?: {
    click?: string
    dragStart?: string
    dragEnd?: string
    drag?: string
    dragCheck?: string
  }
}

export interface PictureDecorationXML extends FormDecorationXML {
  Border?: BorderXML
  BorderColor?: ColorXML
  EnableDrag?: boolean
  EnableStartDrag?: boolean
  FileDragMode?: SE.FileDragMode
  Hyperlink?: boolean
  NonselectedPictureText?: string
  Picture?: PictureXML
  PictureSize?: SE.PictureSize
  Scale?: number
  UserVisible?: UserVisibleXML
  Zoomable?: boolean
  Events?: EventsXML
}

export interface PictureDecorationEnterprise extends FormDecorationEnterprise {
  Рамка?: BorderEnterprise
  ЦветРамки?: ColorEnterprise
  РазрешитьПеретаскивание?: boolean
  РазрешитьНачалоПеретаскивания?: boolean
  СпособПеретаскиванияФайлов?: SE.FileDragModeEnterprise
  Гиперссылка?: boolean
  ТекстНевыбраннойКартинки?: string
  Картинка?: PictureEnterprise
  РазмерКартинки?: SE.PictureSizeEnterprise
  Масштаб?: number
  ПользовательскаяВидимость?: UserVisibleEnterprise
  Масштабировать?: boolean
  События?: {
    Нажатие?: string
    НачалоПеретаскивания?: string
    ОкончаниеПеретаскивания?: string
    Перетаскивание?: string
    ПроверкаПеретаскивания?: string
  }
}
