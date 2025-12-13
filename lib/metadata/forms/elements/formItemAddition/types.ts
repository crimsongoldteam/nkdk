import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { BaseElement, BaseElementEnterprise, BaseElementXML } from "../baseElement/types"
import { ChildItems, ChildItemsXML } from "../childItems/types"
import { CommandBar, CommandBarEnterprise, CommandBarXML } from "../commandBar/types"
import { FormDecoration, FormDecorationEnterprise, FormDecorationXML } from "../formDecoration/types"

export interface FormItemAddition extends BaseElement {
  contextMenu?: CommandBar
  displayImportance?: SE.DisplayImportance
  enabled?: boolean
  extendedToolTip?: FormDecoration
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  title?: I8nText
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormItemAdditionType
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  visible?: boolean
  childItems?: ChildItems
}

export interface FormItemAdditionXML extends BaseElementXML {
  ContextMenu?: CommandBarXML
  _DisplayImportance?: SE.DisplayImportance
  Enabled?: boolean
  ExtendedToolTip?: FormDecorationXML
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  Title?: I8nTextXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormItemAdditionType
  UserVisible?: UserVisibleXML
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  Visible?: boolean
  ChildItems?: ChildItemsXML
}

export interface FormItemAdditionEnterprise extends BaseElementEnterprise {
  КонтекстноеМеню?: CommandBarEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  Доступность?: boolean
  РасширеннаяПодсказка?: FormDecorationEnterprise
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Заголовок?: I8nTextEnterprise
  Подсказка?: I8nTextEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Вид?: SE.FormItemAdditionTypeEnterprise
  ПользовательскаяВидимость?: UserVisibleEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Видимость?: boolean
  ПодчиненныеЭлементы?: ChildItemsEnterprise
}
