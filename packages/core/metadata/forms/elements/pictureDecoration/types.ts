import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import {
  FormDecoration,
  FormDecorationEnterprise,
  FormDecorationXML,
} from "~/metadata/forms/elements/formDecoration/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"

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
  Гиперссылка?: StringboolEnterprise
  Картинка?: PictureEnterprise
  Масштаб?: number
  Масштабировать?: StringboolEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РазмерКартинки?: SE.PictureSizeEnterprise
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  Рамка?: BorderEnterprise
  СпособПеретаскиванияФайлов?: SE.FileDragModeEnterprise
  ТекстНевыбраннойКартинки?: string
  ЦветРамки?: ColorEnterprise
  События?: {
    Нажатие?: string
    НачалоПеретаскивания?: string
    ОкончаниеПеретаскивания?: string
    Перетаскивание?: string
    ПроверкаПеретаскивания?: string
  }
}
