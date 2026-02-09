import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise } from "~/metadata/commonObjects/font/types"
import { FormattedI8nText, FormattedI8nTextEnterprise } from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ContextMenu, ContextMenuEnterprise } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "../extendedTooltip/types"

export interface LabelDecoration {
  elementType: "LabelDecoration"
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
  title?: FormattedI8nText
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormDecorationType
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
  backColor?: Color
  border?: Border
  borderColor?: Color
  groupVerticalAlign?: SE.ItemVerticalAlign
  horizontalAlign?: SE.ItemHorizontalLocation
  hyperlink?: boolean
  titleHeight?: number
  verticalAlign?: SE.ItemVerticalAlign
  events?: {
    click?: string
    uRLProcessing?: string
  }
}

export interface LabelDecorationPartialEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormDecorationTypeEnterprise
  Видимость?: StringboolEnterprise
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: FormattedI8nTextEnterprise
  ФорматированныйЗаголовок?: FormattedI8nTextEnterprise
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
  ВертикальноеВыравниваниеГруппы?: SE.ItemVerticalAlignEnterprise
  ВертикальноеПоложение?: SE.ItemVerticalAlignEnterprise
  ВысотаЗаголовка?: number
  Гиперссылка?: StringboolEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  Рамка?: BorderEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  События?: {
    Нажатие?: string
    ОбработкаНавигационнойСсылки?: string
  }
}
