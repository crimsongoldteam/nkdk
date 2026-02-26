import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"

import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { CommandBarChildItems, CommandBarChildItemsTypedYAML } from "../../commonObjects/childItems/types"
import { ContextMenu, ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../extendedTooltip/types"

export interface SearchControlAddition {
  itemType: "SearchControlAddition"
  additionSource?: string
  name: string
  autoMaxWidth?: boolean
  backColor?: Color
  borderColor?: Color
  font?: Font
  horizontalStretch?: boolean
  maxWidth?: number
  textColor?: Color
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
  childItems: CommandBarChildItems
}

export interface SingleSearchControlAddition
  extends Omit<SearchControlAddition, "name" | "additionSource" | "itemType">, BaseElement {
  itemType: "SingleSearchControlAddition"
}

export interface SearchControlAdditionYAML {
  Источник?: string
  АвтоМаксимальнаяШирина?: StringboolYAML
  МаксимальнаяШирина?: number
  РастягиватьПоГоризонтали?: StringboolYAML
  ЦветРамки?: ColorYAML
  ЦветТекста?: ColorYAML
  ЦветФона?: ColorYAML
  Ширина?: number
  Шрифт?: FontYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  Видимость?: StringboolYAML
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  Доступность?: StringboolYAML
  Заголовок?: I8nTextYAML
  КонтекстноеМеню?: ContextMenuYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  Подсказка?: I8nTextYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  ПодчиненныеЭлементы?: CommandBarChildItemsTypedYAML
}

export interface SingleSearchControlAdditionYAML extends Omit<SearchControlAdditionYAML, "Источник"> {}
