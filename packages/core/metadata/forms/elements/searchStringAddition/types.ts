import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { BaseElement, NamedElement } from "../baseElement/types"
import { ContextMenu, ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../extendedTooltip/types"
import { SearchStringAdditionRules } from "./rules"

export interface SearchStringAddition extends NamedElement {
  itemType: "SearchStringAddition"
  additionSource?: string
  name: string
  backColor?: Color
  borderColor?: Color
  font?: Font
  horizontalStretch?: boolean
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
}

export interface SingleSearchStringAddition
  extends Omit<SearchStringAddition, "name" | "additionSource" | "itemType">, BaseElement {
  itemType: "SingleSearchStringAddition"
}

export interface SearchStringAdditionYAML {
  Источник?: string
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
}

export interface SingleSearchStringAdditionYAML extends Omit<SearchStringAdditionYAML, "Источник"> {}

export type SearchStringAdditionEnterprise = EnterpriseType<typeof SearchStringAdditionRules>
