import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionXML,
} from "~/metadata/commonObjects/typeDescription/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { BaseElementXML, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ContextMenu, ContextMenuEnterprise, ContextMenuXML } from "~/metadata/forms/elements/contextMenu/types"
import { Table, TablePartialEnterprise, TableXML } from "~/metadata/forms/elements/table/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface GanttChartField extends NamedElement {
  elementType: "GanttChartField"
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  height?: number
  horizontalLines?: boolean
  horizontalStretch?: boolean
  intervalsSelectionMode?: SE.GanttChartIntervalsSelectionMode
  maxHeight?: number
  maxWidth?: number
  tableLocation?: SE.GanttChartTableLocation
  userVisible?: UserVisible
  valuesSelectionMode?: SE.GanttChartValuesSelectionMode
  verticalLines?: boolean
  verticalStretch?: boolean
  width?: number
  autoCellHeight?: boolean
  cellHyperlink?: boolean
  contextMenu?: ContextMenu
  dataPath?: string
  defaultItem?: boolean
  displayImportance?: SE.DisplayImportance
  editMode?: SE.ColumnEditMode
  enabled?: boolean
  extendedTooltip?: ExtendedTooltip
  fixingInTable?: SE.FixingInTable
  footerBackColor?: Color
  footerDataPath?: string
  footerFont?: Font
  footerHorizontalAlign?: SE.ItemHorizontalLocation
  footerPicture?: Picture
  footerText?: I8nText
  footerTextColor?: Color
  headerHorizontalAlign?: SE.ItemHorizontalLocation
  headerPicture?: Picture
  horizontalAlign?: SE.ItemHorizontalLocation
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  readOnly?: boolean
  shortcut?: string
  showInFooter?: boolean
  showInHeader?: boolean
  skipOnInput?: boolean
  table?: Table
  title?: I8nText
  titleBackColor?: Color
  titleFont?: Font
  titleHeight?: number
  titleLocation?: SE.FormItemTitleLocation
  titleTextColor?: Color
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormFieldType
  typeRestriction?: TypeDescription
  verticalAlign?: SE.ItemVerticalAlign
  verticalAlignInGroup?: SE.ItemVerticalAlign
  visible?: boolean
  warningOnEdit?: I8nText
  warningOnEditRepresentation?: SE.WarningOnEditRepresentation
  events?: {
    onChange?: string
    selection?: string
    detailProcessing?: string
    beforeExpand?: string
    beforeCollapse?: string
    onActivateValue?: string
    onActivateInterval?: string
    onIntervalEditEnd?: string
  }
}

export interface GanttChartFieldXML extends BaseElementXML {
  AutoCellHeight?: boolean
  CellHyperlink?: boolean
  ContextMenu: ContextMenuXML
  DataPath?: string
  DefaultItem?: boolean
  _DisplayImportance?: SE.DisplayImportance
  EditMode?: SE.ColumnEditMode
  Enabled?: boolean
  ExtendedTooltip: ExtendedTooltipXML
  FixingInTable?: SE.FixingInTable
  FooterBackColor?: ColorXML
  FooterDataPath?: string
  FooterFont?: FontXML
  FooterHorizontalAlign?: SE.ItemHorizontalLocation
  FooterPicture?: PictureXML
  FooterText?: I8nTextXML
  FooterTextColor?: ColorXML
  HeaderHorizontalAlign?: SE.ItemHorizontalLocation
  HeaderPicture?: PictureXML
  HorizontalAlign?: SE.ItemHorizontalLocation
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  ReadOnly?: boolean
  Shortcut?: string
  ShowInFooter?: boolean
  ShowInHeader?: boolean
  SkipOnInput?: boolean
  Table?: TableXML
  Title?: I8nTextXML
  TitleBackColor?: ColorXML
  TitleFont?: FontXML
  TitleHeight?: number
  TitleLocation?: SE.FormItemTitleLocation
  TitleTextColor?: ColorXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormFieldType
  TypeRestriction?: TypeDescriptionXML
  UserVisible?: UserVisibleXML
  VerticalAlign?: SE.ItemVerticalAlign
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  Visible?: boolean
  WarningOnEdit?: I8nTextXML
  WarningOnEditRepresentation?: SE.WarningOnEditRepresentation
  Events?: EventsXML
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  Height?: number
  HorizontalLines?: boolean
  HorizontalStretch?: boolean
  IntervalsSelectionMode?: SE.GanttChartIntervalsSelectionMode
  MaxHeight?: number
  MaxWidth?: number
  TableLocation?: SE.GanttChartTableLocation
  ValuesSelectionMode?: SE.GanttChartValuesSelectionMode
  VerticalLines?: boolean
  VerticalStretch?: boolean
  Width?: number
}

export interface GanttChartFieldPartialEnterprise {
  АвтоВысотаЯчейки?: StringboolEnterprise
  АктивизироватьПоУмолчанию?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложение?: SE.ItemVerticalAlignEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormFieldTypeEnterprise
  Видимость?: StringboolEnterprise
  ВысотаЗаголовка?: number
  ГиперссылкаЯчейки?: StringboolEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальноеПоложениеВПодвале?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальноеПоложениеВШапке?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  КартинкаПодвала?: PictureEnterprise
  КартинкаШапки?: PictureEnterprise
  КонтекстноеМеню?: ContextMenuEnterprise
  ОграничениеТипа?: TypeDescriptionEnterprise
  ОтображатьВПодвале?: StringboolEnterprise
  ОтображатьВШапке?: StringboolEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  ОтображениеПредупрежденияПриРедактировании?: SE.WarningOnEditRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  ПоложениеЗаголовка?: SE.FormItemTitleLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПредупреждениеПриРедактировании?: I8nTextEnterprise
  ПропускатьПриВводе?: StringboolEnterprise
  ПутьКДанным?: string
  ПутьКДаннымПодвала?: string
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  РежимРедактирования?: SE.ColumnEditModeEnterprise
  СочетаниеКлавиш?: string
  Таблица?: TablePartialEnterprise
  ТекстПодвала?: I8nTextEnterprise
  ТолькоПросмотр?: StringboolEnterprise
  ФиксацияВТаблице?: SE.FixingInTableEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  ЦветТекстаПодвала?: ColorEnterprise
  ЦветФонаЗаголовка?: ColorEnterprise
  ЦветФонаПодвала?: ColorEnterprise
  ШрифтЗаголовка?: FontEnterprise
  ШрифтПодвала?: FontEnterprise
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ВертикальныеЛинии?: StringboolEnterprise
  Высота?: number
  ГоризонтальныеЛинии?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ПоложениеТаблицы?: SE.GanttChartTableLocationEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РежимВыделенияЗначений?: SE.GanttChartValuesSelectionModeEnterprise
  РежимВыделенияИнтервалов?: SE.GanttChartIntervalsSelectionModeEnterprise
  Ширина?: number
  События?: {
    ПриИзменении?: string
    Выбор?: string
    ОбработкаРасшифровки?: string
    ПередРазворачиванием?: string
    ПередСворачиванием?: string
    ПриАктивизацииЗначения?: string
    ПриАктивизацииИнтервала?: string
    ПриОкончанииРедактированияИнтервала?: string
  }
}

export interface GanttChartFieldTypedEnterprise extends GanttChartFieldPartialEnterprise {
  Тип: "ПолеДиаграммыГанта"
}

// Для обратной совместимости
export type GanttChartFieldEnterprise = GanttChartFieldPartialEnterprise
