import { StringboolEnterprise } from "~/packages/core/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/packages/core/metadata/commonObjects/i8nText/types"
import {
  UserVisible,
  UserVisibleEnterprise,
  UserVisibleXML,
} from "~/packages/core/metadata/commonObjects/userVisible/types"
import {
  BaseElement,
  BaseElementEnterprise,
  BaseElementXML,
} from "~/packages/core/metadata/forms/elements/baseElement/types"
import {
  ChildItems,
  ChildItemsEnterprise,
  ChildItemsXML,
} from "~/packages/core/metadata/forms/elements/childItems/types"
import {
  CommandBar,
  CommandBarEnterprise,
  CommandBarXML,
} from "~/packages/core/metadata/forms/elements/commandBar/types"
import {
  FormDecoration,
  FormDecorationEnterprise,
  FormDecorationXML,
} from "~/packages/core/metadata/forms/elements/formDecoration/types"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

export interface FormItemAddition extends BaseElement {
  childItems?: ChildItems
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
}

export interface FormItemAdditionXML extends BaseElementXML {
  ChildItems?: ChildItemsXML
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
}

export interface FormItemAdditionEnterprise extends BaseElementEnterprise {
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormItemAdditionTypeEnterprise
  Видимость?: StringboolEnterprise
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  КонтекстноеМеню?: CommandBarEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  ПодчиненныеЭлементы?: ChildItemsEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  РасширеннаяПодсказка?: FormDecorationEnterprise
}
