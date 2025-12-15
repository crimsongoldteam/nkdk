import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import {
  UserVisible,
  UserVisibleAllowEnterprise,
  UserVisibleDenyEnterprise,
  UserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import { BaseElement, BaseElementEnterprise, BaseElementXML } from "~/lib/metadata/forms/elements/baseElement/types"
import { CommandBar, CommandBarEnterprise, CommandBarXML } from "~/lib/metadata/forms/elements/commandBar/types"
import {
  FormDecoration,
  FormDecorationEnterprise,
  FormDecorationXML,
} from "~/lib/metadata/forms/elements/formDecoration/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ChildItems, ChildItemsEnterprise, ChildItemsXML } from "../childItems/types"

export interface FormItemAddition extends BaseElement {
  contextMenu?: CommandBar
  displayImportance?: SE.DisplayImportance
  enabled?: boolean
  extendedToolTip?: FormDecoration
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  name?: string
  title?: I8nText
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormItemAdditionType
  verticalAlignInGroup?: SE.ItemVerticalAlign
  visible?: boolean
  childItems?: ChildItems
  userVisible?: UserVisible
}

export interface FormItemAdditionXML extends BaseElementXML {
  ContextMenu?: CommandBarXML
  _DisplayImportance?: SE.DisplayImportance
  Enabled?: boolean
  ExtendedToolTip?: FormDecorationXML
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  Name?: string
  Title?: I8nTextXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormItemAdditionType
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  Visible?: boolean
  ChildItems?: ChildItemsXML
  UserVisible?: UserVisibleXML
}

export interface FormItemAdditionEnterprise extends BaseElementEnterprise {
  КонтекстноеМеню?: CommandBarEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  Доступность?: StringboolEnterprise
  РасширеннаяПодсказка?: FormDecorationEnterprise
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Имя?: string
  Заголовок?: I8nTextEnterprise
  Подсказка?: I8nTextEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Вид?: SE.FormItemAdditionTypeEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Видимость?: StringboolEnterprise
  ПодчиненныеЭлементы?: ChildItemsEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
}
