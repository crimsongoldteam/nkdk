import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { BorderYAML } from "~/metadata/commonObjects/border/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { FormattedI8nTextYAML } from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { PictureYAML } from "~/metadata/commonObjects/picture/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { ElementTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { PictureDecorationRules } from "./rules"

export type PictureDecoration = ElementTypeByRule<typeof PictureDecorationRules>

export interface PictureDecorationPartialYAML {
  АвтоМаксимальнаяВысота?: StringboolYAML
  АвтоМаксимальнаяШирина?: StringboolYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  Вид?: SE.FormDecorationTypeYAML
  Видимость?: StringboolYAML
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  Доступность?: StringboolYAML
  Заголовок?: FormattedI8nTextYAML
  ФорматированныйЗаголовок?: FormattedI8nTextYAML
  КонтекстноеМеню?: ContextMenuYAML
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  Подсказка?: I8nTextYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  ПропускатьПриВводе?: StringboolYAML
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  СочетаниеКлавиш?: string
  ЦветТекста?: ColorYAML
  Ширина?: number
  Шрифт?: FontYAML
  Гиперссылка?: StringboolYAML
  Картинка?: PictureYAML
  Масштаб?: number
  Масштабировать?: StringboolYAML
  РазмерКартинки?: SE.PictureSizeYAML
  РазрешитьНачалоПеретаскивания?: StringboolYAML
  РазрешитьПеретаскивание?: StringboolYAML
  Рамка?: BorderYAML
  СпособПеретаскиванияФайлов?: SE.FileDragModeYAML
  ТекстНевыбраннойКартинки?: string
  ЦветРамки?: ColorYAML
  События?: {
    Нажатие?: string
    НачалоПеретаскивания?: string
    ОкончаниеПеретаскивания?: string
    Перетаскивание?: string
    ПроверкаПеретаскивания?: string
  }
}

export type PictureDecorationEnterprise = EnterpriseType<typeof PictureDecorationRules>
