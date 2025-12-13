import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { BaseElement, BaseElementEnterprise, BaseElementXML } from "../baseElement/types"
import { ChildItems, ChildItemsXML } from "../childItems/types"
import { FormDecoration, FormDecorationEnterprise, FormDecorationXML } from "../formDecoration/types"

export interface FormGroup extends BaseElement {
  enableContentChange?: boolean
  enabled?: boolean
  extendedTooltip?: FormDecoration
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
  childItems?: ChildItems
}

export interface FormGroupXML extends BaseElementXML {
  EnableContentChange?: boolean
  Enabled?: boolean
  ExtendedTooltip?: FormDecorationXML
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
  ChildItems?: ChildItemsXML
}

export interface FormGroupEnterprise extends BaseElementEnterprise {
  РазрешитьИзменениеСостава?: boolean
  Доступность?: boolean
  РасширеннаяПодсказка?: FormDecorationEnterprise
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  РастягиватьПоГоризонтали?: boolean
  ТолькоПросмотр?: boolean
  СочетаниеКлавиш?: string
  Заголовок?: I8nTextEnterprise
  ШрифтЗаголовка?: FontEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  Подсказка?: I8nTextEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Вид?: SE.FormGroupTypeEnterprise
  ПользовательскаяВидимость?: UserVisibleEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  РастягиватьПоВертикали?: boolean
  Видимость?: boolean
  Ширина?: number
  ПодчиненныеЭлементы?: ChildItemsEnterprise
}
