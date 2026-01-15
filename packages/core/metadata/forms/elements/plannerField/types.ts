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
import { BaseElementXML } from "~/metadata/forms/elements/baseElement/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ContextMenu, ContextMenuEnterprise, ContextMenuXML } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface PlannerField {
  elementType: "PlannerField"
  name: string
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
  table?: string
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
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  dimensionItemHyperlink?: boolean
  enableDrag?: boolean
  enableStartDrag?: boolean
  height?: number
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  timeScaleItemHyperlink?: boolean
  userVisible?: UserVisible
  verticalStretch?: boolean
  width?: number
  wrappedTimeScaleHeaderHyperlink?: boolean
  events?: {
    onChange?: string
    selection?: string
    plannerActionClick?: string
    uRLClick?: string
    wrappedTimeScaleHeaderClick?: string
    dimensionItemClick?: string
    timeScaleItemClick?: string
    dragStart?: string
    commandGenerateProcessing?: string
    dragEnd?: string
    beforeStartQuickEdit?: string
    beforeStartEdit?: string
    beforePrint?: string
    beforeExpandDimensionItem?: string
    beforeCollapseDimensionItem?: string
    beforeCreate?: string
    beforeDelete?: string
    drag?: string
    onActivate?: string
    onEditEnd?: string
    onCurrentRepresentationPeriodChange?: string
    dragCheck?: string
    insideDragCheck?: string
  }
}

export interface PlannerFieldXML extends BaseElementXML {
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
  Table?: string
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
  VerticalAlign?: SE.ItemVerticalAlign
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  Visible?: boolean
  WarningOnEdit?: I8nTextXML
  WarningOnEditRepresentation?: SE.WarningOnEditRepresentation
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  DimensionItemHyperlink?: boolean
  EnableDrag?: boolean
  EnableStartDrag?: boolean
  Height?: number
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  TimeScaleItemHyperlink?: boolean
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Width?: number
  WrappedTimeScaleHeaderHyperlink?: boolean
  Events?: EventsXML
}

export interface PlannerFieldPartialEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  Высота?: number
  ГиперссылкаПеренесенногоЗаголовкаШкалыВремени?: StringboolEnterprise
  ГиперссылкаЭлементаИзмерения?: StringboolEnterprise
  ГиперссылкаЭлементаШкалыВремени?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  Ширина?: number
  События?: {
    ПриИзменении?: string
    Выбор?: string
    НажатиеНаДействиеПланировщика?: string
    НажатиеНаНавигационнойСсылке?: string
    НажатиеНаПеренесенномЗаголовкеШкалыВремени?: string
    НажатиеНаЭлементеИзмерения?: string
    НажатиеНаЭлементеШкалыВремени?: string
    НачалоПеретаскивания?: string
    ОбработкаФормированияКоманд?: string
    ОкончаниеПеретаскивания?: string
    ПередНачаломБыстрогоРедактирования?: string
    ПередНачаломРедактирования?: string
    ПередПечатью?: string
    ПередРазворачиваниемЭлементаИзмерения?: string
    ПередСворачиваниемЭлементаИзмерения?: string
    ПередСозданием?: string
    ПередУдалением?: string
    Перетаскивание?: string
    ПриАктивизации?: string
    ПриОкончанииРедактирования?: string
    ПриСменеТекущегоПериодаОтображения?: string
    ПроверкаПеретаскивания?: string
    ПроверкаПеретаскиванияВнутри?: string
  }
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
  ПредупреждениеПриРедактировании?: I8nTextEnterprise
  ПропускатьПриВводе?: StringboolEnterprise
  ПутьКДанным?: string
  ПутьКДаннымПодвала?: string
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  РежимРедактирования?: SE.ColumnEditModeEnterprise
  СочетаниеКлавиш?: string
  Таблица?: string
  ТекстПодвала?: I8nTextEnterprise
  ТолькоПросмотр?: StringboolEnterprise
  ФиксацияВТаблице?: SE.FixingInTableEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  ЦветТекстаПодвала?: ColorEnterprise
  ЦветФонаЗаголовка?: ColorEnterprise
  ЦветФонаПодвала?: ColorEnterprise
  ШрифтЗаголовка?: FontEnterprise
  ШрифтПодвала?: FontEnterprise
}

export interface PlannerFieldTypedEnterprise extends PlannerFieldPartialEnterprise {
  Тип: "ПолеПланировщика"
}

// Для обратной совместимости
export type PlannerFieldEnterprise = PlannerFieldPartialEnterprise
