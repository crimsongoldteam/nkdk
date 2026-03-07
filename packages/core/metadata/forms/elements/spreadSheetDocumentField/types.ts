import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureYAML } from "~/metadata/commonObjects/picture/types"
import { TypeDescription, TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ContextMenu, ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../extendedTooltip/types"
import { SpreadSheetDocumentFieldRules } from "./rules"

export interface SpreadSheetDocumentField {
  itemType: "SpreadSheetDocumentField"
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
  table?: string
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

export interface SpreadSheetDocumentFieldPartialYAML {
  АвтоМаксимальнаяВысота?: StringboolYAML
  АвтоМаксимальнаяШирина?: StringboolYAML
  ВертикальнаяПолосаПрокрутки?: SE.ScrollBarUseYAML
  Вывод?: SE.UseOutputYAML
  Высота?: number
  ГоризонтальнаяПолосаПрокрутки?: SE.ScrollBarUseYAML
  Защита?: StringboolYAML
  ИспользуемоеИмяФайла?: string
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ОтображатьГруппировки?: StringboolYAML
  ОтображатьЗаголовки?: StringboolYAML
  ОтображатьИменаСтрокИКолонок?: StringboolYAML
  ОтображатьИменаЯчеек?: StringboolYAML
  ОтображатьСетку?: StringboolYAML
  ОтображениеСостояния?: SE.StatePresentationYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  РазрешитьНачалоПеретаскивания?: StringboolYAML
  РазрешитьПеретаскивание?: StringboolYAML
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  Редактирование?: StringboolYAML
  РежимМасштабированияПросмотра?: SE.ViewScalingModeYAML
  РежимОтображенияВыделения?: SE.SelectionShowModeYAML
  РежимОтображенияВыделенияРисунков?: SE.DrawingSelectionShowModeYAML
  ТипКурсоров?: SE.SpreadsheetDocumentPointerTypeYAML
  ЦветРамки?: ColorYAML
  ЧерноБелыйПросмотр?: StringboolYAML
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
  АвтоВысотаЯчейки?: StringboolYAML
  АктивизироватьПоУмолчанию?: StringboolYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ВертикальноеПоложение?: SE.ItemVerticalAlignYAML
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  Вид?: SE.FormFieldTypeYAML
  Видимость?: StringboolYAML
  ВысотаЗаголовка?: number
  ГиперссылкаЯчейки?: StringboolYAML
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationYAML
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  ГоризонтальноеПоложениеВПодвале?: SE.ItemHorizontalLocationYAML
  ГоризонтальноеПоложениеВШапке?: SE.ItemHorizontalLocationYAML
  Доступность?: StringboolYAML
  Заголовок?: I8nTextYAML
  КартинкаПодвала?: PictureYAML
  КартинкаШапки?: PictureYAML
  КонтекстноеМеню?: ContextMenuYAML
  ОграничениеТипа?: TypeDescriptionYAML
  ОтображатьВПодвале?: StringboolYAML
  ОтображатьВШапке?: StringboolYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  ОтображениеПредупрежденияПриРедактировании?: SE.WarningOnEditRepresentationYAML
  Подсказка?: I8nTextYAML
  ПоложениеЗаголовка?: SE.FormItemTitleLocationYAML
  ПредупреждениеПриРедактировании?: I8nTextYAML
  ПропускатьПриВводе?: StringboolYAML
  ПутьКДанным?: string
  ПутьКДаннымПодвала?: string
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  РежимРедактирования?: SE.ColumnEditModeYAML
  СочетаниеКлавиш?: string
  Таблица?: string
  ТекстПодвала?: I8nTextYAML
  ТолькоПросмотр?: StringboolYAML
  ФиксацияВТаблице?: SE.FixingInTableYAML
  ЦветТекстаЗаголовка?: ColorYAML
  ЦветТекстаПодвала?: ColorYAML
  ЦветФонаЗаголовка?: ColorYAML
  ЦветФонаПодвала?: ColorYAML
  ШрифтЗаголовка?: FontYAML
  ШрифтПодвала?: FontYAML
}

export type SpreadSheetDocumentFieldEnterprise = EnterpriseType<typeof SpreadSheetDocumentFieldRules>
