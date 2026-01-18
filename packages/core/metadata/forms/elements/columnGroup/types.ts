import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { TableChildItems, TableChildItemsEnterprise, TableChildItemsXML } from "../../collections/tableChildItems/types"
import { BaseElementXML, NamedElement } from "../baseElement/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface ColumnGroup extends NamedElement {
  elementType: "ColumnGroup"
  fixingInTable?: SE.FixingInTable
  group?: SE.ColumnsGroup
  headerDataPath?: string
  headerFormat?: string
  headerHorizontalAlign?: SE.ItemHorizontalLocation
  headerPicture?: Picture
  showInHeader?: boolean
  showTitle?: boolean
  titleBackColor?: Color
  userVisible?: UserVisible
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
  extendedTooltip?: ExtendedTooltip
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
  childItems: TableChildItems
}

export interface ColumnGroupXML extends BaseElementXML {
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
  ExtendedTooltip: ExtendedTooltipXML
  UserVisible?: UserVisibleXML
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
  FixingInTable?: SE.FixingInTable
  Group?: SE.ColumnsGroup
  HeaderDataPath?: string
  HeaderFormat?: string
  HeaderHorizontalAlign?: SE.ItemHorizontalLocation
  HeaderPicture?: PictureXML
  ShowInHeader?: boolean
  ShowTitle?: boolean
  TitleBackColor?: ColorXML
  ChildItems?: TableChildItemsXML
}

export interface ColumnGroupPartialEnterprise {
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
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  СочетаниеКлавиш?: string
  ТолькоПросмотр?: StringboolEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  Ширина?: number
  ШрифтЗаголовка?: FontEnterprise
  ГоризонтальноеПоложениеВШапке?: SE.ItemHorizontalLocationEnterprise
  Группировка?: SE.ColumnsGroupEnterprise
  КартинкаШапки?: PictureEnterprise
  ОтображатьВШапке?: StringboolEnterprise
  ОтображатьЗаголовок?: StringboolEnterprise
  ПутьКДаннымШапки?: string
  ФиксацияВТаблице?: SE.FixingInTableEnterprise
  ФорматШапки?: string
  ЦветФонаЗаголовка?: ColorEnterprise
  ПодчиненныеЭлементы?: TableChildItemsEnterprise
}

export interface ColumnGroupTypedEnterprise extends ColumnGroupPartialEnterprise {
  Тип: "ГруппаКолонок"
}
