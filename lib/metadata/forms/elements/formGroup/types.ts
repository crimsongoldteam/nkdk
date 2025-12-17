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
import { ChildItems, ChildItemsEnterprise, ChildItemsXML } from "~/lib/metadata/forms/childItems/types"
import { BaseElement, BaseElementEnterprise, BaseElementXML } from "~/lib/metadata/forms/elements/baseElement/types"
import {
  FormDecoration,
  FormDecorationEnterprise,
  FormDecorationXML,
} from "~/lib/metadata/forms/elements/formDecoration/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface FormGroup extends BaseElement {
  enableContentChange?: boolean
  enabled?: boolean
  extendedTooltip?: FormDecoration
  height?: number
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  horizontalStretch?: boolean
  name?: string
  readOnly?: boolean
  shortcut?: string
  title?: I8nText
  titleFont?: Font
  titleTextColor?: Color
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormGroupType
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
  childItems?: ChildItems
  userVisible?: UserVisible
}

export interface FormGroupXML extends BaseElementXML {
  EnableContentChange?: boolean
  Enabled?: boolean
  ExtendedTooltip?: FormDecorationXML
  Height?: number
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  HorizontalStretch?: boolean
  Name?: string
  ReadOnly?: boolean
  Shortcut?: string
  Title?: I8nTextXML
  TitleFont?: FontXML
  TitleTextColor?: ColorXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormGroupType
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
  ChildItems?: ChildItemsXML
  UserVisible?: UserVisibleXML
}

export interface FormGroupEnterprise extends BaseElementEnterprise {
  РазрешитьИзменениеСостава?: StringboolEnterprise
  Доступность?: StringboolEnterprise
  РасширеннаяПодсказка?: FormDecorationEnterprise
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  Имя?: string
  ТолькоПросмотр?: StringboolEnterprise
  СочетаниеКлавиш?: string
  Заголовок?: I8nTextEnterprise
  ШрифтЗаголовка?: FontEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  Подсказка?: I8nTextEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Вид?: SE.FormGroupTypeEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  Видимость?: StringboolEnterprise
  Ширина?: number
  ПодчиненныеЭлементы?: ChildItemsEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleAllowEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleDenyEnterprise
}
