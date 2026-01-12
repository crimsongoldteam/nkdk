import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderXML } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"

import * as SE from "~/metadata/systemEnumerations/types"
import { ChildItemsEnterprise } from "../../collections/childItems/types"
import { BaseElementXML } from "../baseElement/types"
import { ContextMenu, ContextMenuEnterprise, ContextMenuXML } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipPropsEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface ViewStatusAddition {
  autoMaxWidth?: boolean
  backColor?: Color
  border?: Border
  borderColor?: Color
  buttonsBackColor?: Color
  font?: Font
  horizontalAlign?: SE.ItemHorizontalLocation
  horizontalStretch?: boolean
  maxWidth?: number
  textColor?: Color
  titleFont?: Font
  titleTextColor?: Color
  width?: number
  contextMenu?: ContextMenu
  displayImportance?: SE.DisplayImportance
  enabled?: boolean
  extendedTooltip?: ExtendedTooltip
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  title?: I8nText
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  visible?: boolean
}

export interface ViewStatusAdditionXML extends BaseElementXML {
  AutoMaxWidth?: boolean
  BackColor?: ColorXML
  Border?: BorderXML
  BorderColor?: ColorXML
  ButtonsBackColor?: ColorXML
  Font?: FontXML
  HorizontalAlign?: SE.ItemHorizontalLocation
  HorizontalStretch?: boolean
  MaxWidth?: number
  TextColor?: ColorXML
  TitleFont?: FontXML
  TitleTextColor?: ColorXML
  UserVisible?: UserVisibleXML
  Width?: number
  ContextMenu?: ContextMenuXML
  _DisplayImportance?: SE.DisplayImportance
  Enabled?: boolean
  ExtendedTooltip?: ExtendedTooltipXML
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  Title?: I8nTextXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  Visible?: boolean
}

export interface ViewStatusAdditionEnterprise {
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  МаксимальнаяШирина?: number
  Рамка?: BorderEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  ЦветФонаКнопок?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
  ШрифтЗаголовка?: FontEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormItemAdditionTypeEnterprise
  Видимость?: StringboolEnterprise
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  КонтекстноеМеню?: ContextMenuEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  ПодчиненныеЭлементы?: ChildItemsEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РасширеннаяПодсказка?: ExtendedTooltipPropsEnterprise
}
