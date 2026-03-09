import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderYAML } from "~/metadata/commonObjects/border/types"
import { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"

import { ElementReferenceTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { BaseElement } from "../baseElement/types"
import { ContextMenu, ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../extendedTooltip/types"
import { ViewStatusAdditionRules } from "./rules"

export type ViewStatusAdditionReference = ElementReferenceTypeByRule<typeof ViewStatusAdditionRules>

export interface ViewStatusAddition extends BaseElement {
  itemType: "ViewStatusAddition"
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

export interface ViewStatusAdditionYAML {
  АвтоМаксимальнаяШирина?: StringboolYAML
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationYAML
  МаксимальнаяШирина?: number
  Рамка?: BorderYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  ЦветРамки?: ColorYAML
  ЦветТекста?: ColorYAML
  ЦветТекстаЗаголовка?: ColorYAML
  ЦветФона?: ColorYAML
  ЦветФонаКнопок?: ColorYAML
  Ширина?: number
  Шрифт?: FontYAML
  ШрифтЗаголовка?: FontYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  Доступность?: StringboolYAML
  Заголовок?: I8nTextYAML
  КонтекстноеМеню?: ContextMenuYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  Подсказка?: I8nTextYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
}

export type ViewStatusAdditionEnterprise = EnterpriseType<typeof ViewStatusAdditionRules>
