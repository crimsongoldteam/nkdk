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
import { Table, TablePartialEnterprise, TableXML } from "../table/types"

export interface SpreadSheetDocumentField {
  elementType: "SpreadSheetDocumentField"
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
  userVisible?: UserVisible
  verticalAlign?: SE.ItemVerticalAlign
  verticalAlignInGroup?: SE.ItemVerticalAlign
  visible?: boolean
  warningOnEdit?: I8nText
  warningOnEditRepresentation?: SE.WarningOnEditRepresentation
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  blackAndWhiteView?: boolean
  borderColor?: Color
  drawingSelectionShowMode?: SE.DrawingSelectionShowMode
  edit?: boolean
  enableDrag?: boolean
  enableStartDrag?: boolean
  height?: number
  horizontalScrollBar?: SE.ScrollBarUse
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  output?: SE.UseOutput
  pointerType?: SE.SpreadsheetDocumentPointerType
  protection?: boolean
  selectionShowMode?: SE.SelectionShowMode
  showCellNames?: boolean
  showGrid?: boolean
  showGroups?: boolean
  showHeaders?: boolean
  showRowAndColumnNames?: boolean
  statePresentation?: SE.StatePresentation
  usedFileName?: string
  verticalScrollBar?: SE.ScrollBarUse
  verticalStretch?: boolean
  viewScalingMode?: SE.ViewScalingMode
  width?: number
  events?: {
    onChange?: string
    selection?: string
    dragStart?: string
    additionalDetailProcessing?: string
    uRLProcessing?: string
    detailProcessing?: string
    dragEnd?: string
    beforeWrite?: string
    beforePrint?: string
    drag?: string
    afterWrite?: string
    onActivate?: string
    onChangeAreaContentEvent?: string
    dragCheck?: string
  }
}

export interface SpreadSheetDocumentFieldXML extends BaseElementXML {
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
  VerticalAlign?: SE.ItemVerticalAlign
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  Visible?: boolean
  WarningOnEdit?: I8nTextXML
  WarningOnEditRepresentation?: SE.WarningOnEditRepresentation
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  BlackAndWhiteView?: boolean
  BorderColor?: ColorXML
  DrawingSelectionShowMode?: SE.DrawingSelectionShowMode
  Edit?: boolean
  EnableDrag?: boolean
  EnableStartDrag?: boolean
  Height?: number
  HorizontalScrollBar?: SE.ScrollBarUse
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  Output?: SE.UseOutput
  PointerType?: SE.SpreadsheetDocumentPointerType
  Protection?: boolean
  SelectionShowMode?: SE.SelectionShowMode
  ShowCellNames?: boolean
  ShowGrid?: boolean
  ShowGroups?: boolean
  ShowHeaders?: boolean
  ShowRowAndColumnNames?: boolean
  StatePresentation?: SE.StatePresentation
  UsedFileName?: string
  UserVisible?: UserVisibleXML
  VerticalScrollBar?: SE.ScrollBarUse
  VerticalStretch?: boolean
  ViewScalingMode?: SE.ViewScalingMode
  Width?: number
  Events?: EventsXML
}

export interface SpreadSheetDocumentFieldPartialEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ВертикальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise
  Вывод?: SE.UseOutputEnterprise
  Высота?: number
  ГоризонтальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise
  Защита?: StringboolEnterprise
  ИспользуемоеИмяФайла?: string
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ОтображатьГруппировки?: StringboolEnterprise
  ОтображатьЗаголовки?: StringboolEnterprise
  ОтображатьИменаСтрокИКолонок?: StringboolEnterprise
  ОтображатьИменаЯчеек?: StringboolEnterprise
  ОтображатьСетку?: StringboolEnterprise
  ОтображениеСостояния?: SE.StatePresentationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  Редактирование?: StringboolEnterprise
  РежимМасштабированияПросмотра?: SE.ViewScalingModeEnterprise
  РежимОтображенияВыделения?: SE.SelectionShowModeEnterprise
  РежимОтображенияВыделенияРисунков?: SE.DrawingSelectionShowModeEnterprise
  ТипКурсоров?: SE.SpreadsheetDocumentPointerTypeEnterprise
  ЦветРамки?: ColorEnterprise
  ЧерноБелыйПросмотр?: StringboolEnterprise
  Ширина?: number
  События?: {
    ПриИзменении?: string
    Выбор?: string
    НачалоПеретаскивания?: string
    ОбработкаДополнительнойРасшифровки?: string
    ОбработкаНавигационнойСсылки?: string
    ОбработкаРасшифровки?: string
    ОкончаниеПеретаскивания?: string
    ПередЗаписью?: string
    ПередПечатью?: string
    Перетаскивание?: string
    ПослеЗаписи?: string
    ПриАктивизации?: string
    ПриИзмененииСодержимогоОбласти?: string
    ПроверкаПеретаскивания?: string
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
}

export interface SpreadSheetDocumentFieldTypedEnterprise extends SpreadSheetDocumentFieldPartialEnterprise {
  Тип: "ПолеТабличногоДокумента"
}

// Для обратной совместимости
export type SpreadSheetDocumentFieldEnterprise = SpreadSheetDocumentFieldPartialEnterprise
