import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ContextMenu, ContextMenuEnterprise } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "../extendedTooltip/types"

export interface SearchStringAddition {
  elementType: "SearchStringAddition"
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

export interface SingleSearchStringAddition extends Omit<
  SearchStringAddition,
  "name" | "additionSource" | "elementType"
> {
  elementType: "SingleSearchStringAddition"
}

export interface SearchStringAdditionEnterprise {
  Источник?: string
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
}

export interface SingleSearchStringAdditionEnterprise extends Omit<SearchStringAdditionEnterprise, "Источник"> {}
