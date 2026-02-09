import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise } from "~/metadata/commonObjects/userVisible/types"

import * as SE from "~/metadata/systemEnumerations/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { CommandBarChildItems, CommandBarChildItemsTypedEnterprise } from "../../collections/childItems/types"
import { ContextMenu, ContextMenuEnterprise } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "../extendedTooltip/types"

export interface SearchControlAddition {
  elementType: "SearchControlAddition"
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
  extends Omit<SearchControlAddition, "name" | "additionSource" | "elementType">,
    BaseElement {
  elementType: "SearchControlAddition"
}

export interface SearchControlAdditionEnterprise {
  Источник?: string
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  МаксимальнаяШирина?: number
  РастягиватьПоГоризонтали?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Видимость?: StringboolEnterprise
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  КонтекстноеМеню?: ContextMenuEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  ПодчиненныеЭлементы?: CommandBarChildItemsTypedEnterprise
}

export interface SingleSearchControlAdditionEnterprise extends Omit<SearchControlAdditionEnterprise, "Источник"> {}
