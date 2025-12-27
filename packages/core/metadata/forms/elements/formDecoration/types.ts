import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { BaseElement, BaseElementEnterprise, BaseElementXML } from "~/metadata/forms/elements/baseElement/types"
import { CommandBar, CommandBarEnterprise, CommandBarXML } from "~/metadata/forms/elements/commandBar/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface FormDecoration extends BaseElement {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  contextMenu?: CommandBar
  displayImportance?: SE.DisplayImportance
  enabled?: boolean
  extendedTooltip?: FormDecoration
  font?: Font
  height?: number
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  shortcut?: string
  skipOnInput?: boolean
  textColor?: Color
  title?: I8nText
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormDecorationType
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
}

export interface FormDecorationXML extends BaseElementXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  ContextMenu?: CommandBarXML
  _DisplayImportance?: SE.DisplayImportance
  Enabled?: boolean
  ExtendedTooltip?: FormDecorationXML
  Font?: FontXML
  Height?: number
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  Shortcut?: string
  SkipOnInput?: boolean
  TextColor?: ColorXML
  Title?: I8nTextXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormDecorationType
  UserVisible?: UserVisibleXML
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
}

export interface FormDecorationEnterprise extends BaseElementEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormDecorationTypeEnterprise
  Видимость?: StringboolEnterprise
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  КонтекстноеМеню?: CommandBarEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  ПропускатьПриВводе?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РасширеннаяПодсказка?: FormDecorationEnterprise
  СочетаниеКлавиш?: string
  ЦветТекста?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
}
