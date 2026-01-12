import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import {
  FormItemAddition,
  FormItemAdditionEnterprise,
  FormItemAdditionXML,
} from "~/metadata/forms/elements/formItemAddition/types"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  ButtonGroupChildItems,
  ButtonGroupChildItemsEnterprise,
  ButtonGroupChildItemsXML,
} from "../../collections/buttonGroupChildItems/types"
import { ContextMenu, ContextMenuEnterprise, ContextMenuXML } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipPropsEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface SearchControlAddition extends FormItemAddition {
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
  type?: SE.FormItemAdditionType
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  visible?: boolean
  childItems: ButtonGroupChildItems
}

export interface SearchControlAdditionXML extends FormItemAdditionXML {
  AutoMaxWidth?: boolean
  BackColor?: ColorXML
  BorderColor?: ColorXML
  Font?: FontXML
  HorizontalStretch?: boolean
  MaxWidth?: number
  TextColor?: ColorXML
  Width?: number
  ChildItems?: ButtonGroupChildItemsXML
  ContextMenu: ContextMenuXML
  _DisplayImportance?: SE.DisplayImportance
  Enabled?: boolean
  ExtendedTooltip: ExtendedTooltipXML
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  Title?: I8nTextXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormItemAdditionType
  UserVisible?: UserVisibleXML
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  Visible?: boolean
}

export interface SearchControlAdditionEnterprise extends FormItemAdditionEnterprise {
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
  Вид?: SE.FormItemAdditionTypeEnterprise
  Видимость?: StringboolEnterprise
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  КонтекстноеМеню?: ContextMenuEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РасширеннаяПодсказка?: ExtendedTooltipPropsEnterprise
  ПодчиненныеЭлементы?: ButtonGroupChildItemsEnterprise
}
