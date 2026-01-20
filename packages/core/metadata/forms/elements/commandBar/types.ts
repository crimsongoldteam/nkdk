import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  CommandBarChildItem,
  CommandBarChildItemsTypedEnterprise,
  CommandBarChildItemsXML,
} from "../../collections/commandBarChildItems/types"
import { BaseElementXML, NamedElement } from "../baseElement/types"

export interface CommandBar extends NamedElement {
  elementType: "CommandBar"
  autofill?: boolean
  displayImportance?: SE.DisplayImportance
  horizontalAlign?: SE.ItemHorizontalLocation
  enableContentChange?: boolean
  enabled?: boolean
  height?: number
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  horizontalStretch?: boolean
  readOnly?: boolean
  shortcut?: string
  title?: I8nText
  titleFont?: Font
  titleTextColor?: Color
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormGroupType
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
  childItems: CommandBarChildItem[]
}

export interface CommandBarXML extends BaseElementXML {
  Autofill?: boolean
  _DisplayImportance?: SE.DisplayImportance
  HorizontalAlign?: SE.ItemHorizontalLocation
  EnableContentChange?: boolean
  Enabled?: boolean
  Height?: number
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  HorizontalStretch?: boolean
  ReadOnly?: boolean
  Shortcut?: string
  Title?: I8nTextXML
  TitleFont?: FontXML
  TitleTextColor?: ColorXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormGroupType
  UserVisible?: UserVisibleXML
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
  ChildItems?: CommandBarChildItemsXML
}

export interface CommandBarPartialEnterprise {
  Автозаполнение?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormGroupTypeEnterprise
  Видимость?: StringboolEnterprise
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РазрешитьИзменениеСостава?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  СочетаниеКлавиш?: string
  ТолькоПросмотр?: StringboolEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  Ширина?: number
  ШрифтЗаголовка?: FontEnterprise
  ПодчиненныеЭлементы?: CommandBarChildItemsTypedEnterprise
}

export interface CommandBarTypedEnterprise extends CommandBarPartialEnterprise {
  Тип: "КоманднаяПанель"
}
