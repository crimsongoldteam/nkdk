import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { BaseElementXML } from "~/metadata/forms/elements/baseElement/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ContextMenu, ContextMenuEnterprise, ContextMenuXML } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface PictureDecoration {
  elementType: "PictureDecoration"
  name: string
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  contextMenu?: ContextMenu
  displayImportance?: SE.DisplayImportance
  enabled?: boolean
  extendedTooltip?: ExtendedTooltip
  font?: Font
  height?: number
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  shortcut?: string
  skipOnInput?: boolean
  textColor?: Color
  title?: I8nText
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormDecorationType
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
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
  zoomable?: boolean
  events?: {
    click?: string
    dragStart?: string
    dragEnd?: string
    drag?: string
    dragCheck?: string
  }
}

export interface PictureDecorationXML extends BaseElementXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  ContextMenu: ContextMenuXML
  _DisplayImportance?: SE.DisplayImportance
  Enabled?: boolean
  ExtendedTooltip: ExtendedTooltipXML
  Font?: FontXML
  Height?: number
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  Shortcut?: string
  SkipOnInput?: boolean
  TextColor?: ColorXML
  Title?: I8nTextXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormDecorationType
  UserVisible?: UserVisibleXML
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
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
  Zoomable?: boolean
  Events?: EventsXML
}

export interface PictureDecorationPartialEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormDecorationTypeEnterprise
  Видимость?: StringboolEnterprise
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  КонтекстноеМеню?: ContextMenuEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПропускатьПриВводе?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  СочетаниеКлавиш?: string
  ЦветТекста?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
  Гиперссылка?: StringboolEnterprise
  Картинка?: PictureEnterprise
  Масштаб?: number
  Масштабировать?: StringboolEnterprise
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

export interface PictureDecorationTypedEnterprise extends PictureDecorationPartialEnterprise {
  Тип: "Рисунок"
}

/**
 * @deprecated Use PictureDecorationPartialEnterprise or PictureDecorationTypedEnterprise instead
 */
export type PictureDecorationEnterprise = PictureDecorationPartialEnterprise
