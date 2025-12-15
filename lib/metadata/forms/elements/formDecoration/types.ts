import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types"
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
  name?: string
  shortcut?: string
  skipOnInput?: boolean
  textColor?: Color
  title?: I8nText
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormDecorationType
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
  userVisible?: UserVisible
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
  Name?: string
  Shortcut?: string
  SkipOnInput?: boolean
  TextColor?: ColorXML
  Title?: I8nTextXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormDecorationType
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
  UserVisible?: UserVisibleXML
}

export interface FormDecorationEnterprise extends BaseElementEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  КонтекстноеМеню?: CommandBarEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  Доступность?: StringboolEnterprise
  РасширеннаяПодсказка?: FormDecorationEnterprise
  Шрифт?: FontEnterprise
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  Имя?: string
  СочетаниеКлавиш?: string
  ПропускатьПриВводе?: StringboolEnterprise
  ЦветТекста?: ColorEnterprise
  Заголовок?: I8nTextEnterprise
  Подсказка?: I8nTextEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Вид?: SE.FormDecorationTypeEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  Видимость?: StringboolEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
}
