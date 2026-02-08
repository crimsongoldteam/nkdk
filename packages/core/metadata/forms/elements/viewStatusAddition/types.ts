import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"

import * as SE from "~/metadata/systemEnumerations/types"
import { ContextMenu, ContextMenuEnterprise } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "../extendedTooltip/types"

export interface ViewStatusAddition {
  elementType: "ViewStatusAddition"
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
  // horizontalAlignInGroup?: SE.ItemHorizontalLocation
  title?: I8nText
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  // userVisible?: UserVisible
  // verticalAlignInGroup?: SE.ItemVerticalAlign
  // visible?: boolean
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
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  КонтекстноеМеню?: ContextMenuEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
}
