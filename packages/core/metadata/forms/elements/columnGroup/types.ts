import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureYAML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { TableChildItems, TableChildItemsTypedYAML } from "../../collections/childItems/types"
import { NamedElement } from "../baseElement/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../extendedTooltip/types"

export interface ColumnGroup extends NamedElement {
  itemType: "ColumnGroup"
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

export interface ColumnGroupPartialYAML {
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  Вид?: SE.FormGroupTypeYAML
  Видимость?: StringboolYAML
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  Доступность?: StringboolYAML
  Заголовок?: I8nTextYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  Подсказка?: I8nTextYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  РазрешитьИзменениеСостава?: StringboolYAML
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  СочетаниеКлавиш?: string
  ТолькоПросмотр?: StringboolYAML
  ЦветТекстаЗаголовка?: ColorYAML
  Ширина?: number
  ШрифтЗаголовка?: FontYAML
  ГоризонтальноеПоложениеВШапке?: SE.ItemHorizontalLocationYAML
  Группировка?: SE.ColumnsGroupYAML
  КартинкаШапки?: PictureYAML
  ОтображатьВШапке?: StringboolYAML
  ОтображатьЗаголовок?: StringboolYAML
  ПутьКДаннымШапки?: string
  ФиксацияВТаблице?: SE.FixingInTableYAML
  ФорматШапки?: string
  ЦветФонаЗаголовка?: ColorYAML
  ПодчиненныеЭлементы?: TableChildItemsTypedYAML
}

export interface ColumnGroupTypedYAML extends ColumnGroupPartialYAML {
  Тип: "ГруппаКолонок"
}
