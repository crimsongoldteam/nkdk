import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialEnterprise,
  SpreadSheetDocumentFieldTypedEnterprise,
} from "~/metadata/forms/elements/spreadSheetDocumentField/types"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ImportPartialFromEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importContextMenuFromEnterprise } from "../contextMenu/importFromEnterprise"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"
import { PropertyRule } from "../calendarField/rules"

export function importSpreadSheetDocumentFieldTypedFromEnterprise<To extends SpreadSheetDocumentField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importSpreadSheetDocumentFieldPropsFromEnterprise(context, undefined, data)

  const result: SpreadSheetDocumentField = {
    ...props,
    elementType: "SpreadSheetDocumentField",
    name,
  }

  const title = importI8nTextFromEnterprise(context, undefined, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importSpreadSheetDocumentFieldPartialFromEnterprise<To extends SpreadSheetDocumentField>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importSpreadSheetDocumentFieldPropsFromEnterprise(context, undefined, data)

  // Merge events from Enterprise data with existing events from source
  const mergedEvents = props.events !== undefined ? { ...source.events, ...props.events } : source.events

  // Preserve extendedTooltip from source if Enterprise data has empty object
  const extendedTooltip =
    props.extendedTooltip !== undefined && Object.keys(props.extendedTooltip).length > 0
      ? props.extendedTooltip
      : source.extendedTooltip

  // Preserve contextMenu and table from source if not in Enterprise data
  const contextMenu = props.contextMenu !== undefined ? props.contextMenu : source.contextMenu
  const table = props.table !== undefined ? props.table : source.table

  const result: To = {
    ...source,
    ...props,
    elementType: "SpreadSheetDocumentField",
    name: source.name,
    events: mergedEvents,
    extendedTooltip,
    contextMenu,
    table,
  }

  const title = importI8nTextCombinedFromEnterprise(context, undefined, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importSpreadSheetDocumentFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: SpreadSheetDocumentFieldTypedEnterprise | SpreadSheetDocumentFieldPartialEnterprise | undefined
): Omit<Partial<SpreadSheetDocumentField>, "elementType" | "name"> => {
  const result: Omit<Partial<SpreadSheetDocumentField>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoCellHeight = importBooleanFromEnterprise(context, undefined, data.АвтоВысотаЯчейки)
  if (autoCellHeight !== undefined) result.autoCellHeight = autoCellHeight

  const defaultItem = importBooleanFromEnterprise(context, undefined, data.АктивизироватьПоУмолчанию)
  if (defaultItem !== undefined) result.defaultItem = defaultItem

  const displayImportance = importSystemEnumerationFromYAML<SE.DisplayImportance>(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const verticalAlign = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложение,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlign !== undefined) result.verticalAlign = verticalAlign

  const verticalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromYAML<SE.FormFieldType>(context, data.Вид, SE.FormFieldTypeFromEnterprise)
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, undefined, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.ВысотаЗаголовка !== undefined) result.titleHeight = data.ВысотаЗаголовка

  const cellHyperlink = importBooleanFromEnterprise(context, undefined, data.ГиперссылкаЯчейки)
  if (cellHyperlink !== undefined) result.cellHyperlink = cellHyperlink

  const horizontalAlign = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложение,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlign !== undefined) result.horizontalAlign = horizontalAlign

  const horizontalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const footerHorizontalAlign = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВПодвале,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (footerHorizontalAlign !== undefined) result.footerHorizontalAlign = footerHorizontalAlign

  const headerHorizontalAlign = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВШапке,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (headerHorizontalAlign !== undefined) result.headerHorizontalAlign = headerHorizontalAlign

  const enabled = importBooleanFromEnterprise(context, undefined, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const footerPicture = importPictureFromEnterprise(context, undefined, data.КартинкаПодвала)
  if (footerPicture !== undefined) result.footerPicture = footerPicture

  const headerPicture = importPictureFromEnterprise(context, undefined, data.КартинкаШапки)
  if (headerPicture !== undefined) result.headerPicture = headerPicture

  const contextMenu = importContextMenuFromEnterprise(context, undefined, data.КонтекстноеМеню)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  const typeRestriction = importTypeDescriptionFromEnterprise(context, undefined, data.ОграничениеТипа)
  if (typeRestriction !== undefined) result.typeRestriction = typeRestriction

  const showInFooter = importBooleanFromEnterprise(context, undefined, data.ОтображатьВПодвале)
  if (showInFooter !== undefined) result.showInFooter = showInFooter

  const showInHeader = importBooleanFromEnterprise(context, undefined, data.ОтображатьВШапке)
  if (showInHeader !== undefined) result.showInHeader = showInHeader

  const toolTipRepresentation = importSystemEnumerationFromYAML<SE.ToolTipRepresentation>(
    context,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const warningOnEditRepresentation = importSystemEnumerationFromYAML<SE.WarningOnEditRepresentation>(
    context,
    data.ОтображениеПредупрежденияПриРедактировании,
    SE.WarningOnEditRepresentationFromEnterprise
  )
  if (warningOnEditRepresentation !== undefined) result.warningOnEditRepresentation = warningOnEditRepresentation

  const toolTip = importI8nTextFromEnterprise(context, undefined, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const titleLocation = importSystemEnumerationFromYAML<SE.FormItemTitleLocation>(
    context,
    data.ПоложениеЗаголовка,
    SE.FormItemTitleLocationFromEnterprise
  )
  if (titleLocation !== undefined) result.titleLocation = titleLocation

  const userVisible = importUserVisibleFromEnterprise(
    context,
    undefined,
    data.РазрешитьИспользование,
    data.ЗапретитьИспользование
  )
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  const warningOnEdit = importI8nTextFromEnterprise(context, undefined, data.ПредупреждениеПриРедактировании)
  if (warningOnEdit !== undefined) result.warningOnEdit = warningOnEdit

  const skipOnInput = importBooleanFromEnterprise(context, undefined, data.ПропускатьПриВводе)
  if (skipOnInput !== undefined) result.skipOnInput = skipOnInput

  if (data.ПутьКДанным !== undefined) result.dataPath = data.ПутьКДанным

  if (data.ПутьКДаннымПодвала !== undefined) result.footerDataPath = data.ПутьКДаннымПодвала

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, undefined, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  const editMode = importSystemEnumerationFromYAML<SE.ColumnEditMode>(
    context,
    data.РежимРедактирования,
    SE.ColumnEditModeFromEnterprise
  )
  if (editMode !== undefined) result.editMode = editMode

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const footerText = importI8nTextFromEnterprise(context, undefined, data.ТекстПодвала)
  if (footerText !== undefined) result.footerText = footerText

  const readOnly = importBooleanFromEnterprise(context, undefined, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const fixingInTable = importSystemEnumerationFromYAML<SE.FixingInTable>(
    context,
    data.ФиксацияВТаблице,
    SE.FixingInTableFromEnterprise
  )
  if (fixingInTable !== undefined) result.fixingInTable = fixingInTable

  const titleTextColor = importColorFromEnterprise(context, undefined, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const footerTextColor = importColorFromEnterprise(context, undefined, data.ЦветТекстаПодвала)
  if (footerTextColor !== undefined) result.footerTextColor = footerTextColor

  const titleBackColor = importColorFromEnterprise(context, undefined, data.ЦветФонаЗаголовка)
  if (titleBackColor !== undefined) result.titleBackColor = titleBackColor

  const footerBackColor = importColorFromEnterprise(context, undefined, data.ЦветФонаПодвала)
  if (footerBackColor !== undefined) result.footerBackColor = footerBackColor

  const titleFont = importFontFromEnterprise(context, undefined, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const footerFont = importFontFromEnterprise(context, undefined, data.ШрифтПодвала)
  if (footerFont !== undefined) result.footerFont = footerFont

  const autoMaxHeight = importBooleanFromEnterprise(context, undefined, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, undefined, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const verticalScrollBar = importSystemEnumerationFromYAML<SE.ScrollBarUse>(
    context,
    data.ВертикальнаяПолосаПрокрутки,
    SE.ScrollBarUseFromEnterprise
  )
  if (verticalScrollBar !== undefined) result.verticalScrollBar = verticalScrollBar

  const output = importSystemEnumerationFromYAML<SE.UseOutput>(context, data.Вывод, SE.UseOutputFromEnterprise)
  if (output !== undefined) result.output = output

  if (data.Высота !== undefined) result.height = data.Высота

  const horizontalScrollBar = importSystemEnumerationFromYAML<SE.ScrollBarUse>(
    context,
    data.ГоризонтальнаяПолосаПрокрутки,
    SE.ScrollBarUseFromEnterprise
  )
  if (horizontalScrollBar !== undefined) result.horizontalScrollBar = horizontalScrollBar

  const protection = importBooleanFromEnterprise(context, undefined, data.Защита)
  if (protection !== undefined) result.protection = protection

  if (data.ИспользуемоеИмяФайла !== undefined) result.usedFileName = data.ИспользуемоеИмяФайла

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const showGroups = importBooleanFromEnterprise(context, undefined, data.ОтображатьГруппировки)
  if (showGroups !== undefined) result.showGroups = showGroups

  const showHeaders = importBooleanFromEnterprise(context, undefined, data.ОтображатьЗаголовки)
  if (showHeaders !== undefined) result.showHeaders = showHeaders

  const showRowAndColumnNames = importBooleanFromEnterprise(context, undefined, data.ОтображатьИменаСтрокИКолонок)
  if (showRowAndColumnNames !== undefined) result.showRowAndColumnNames = showRowAndColumnNames

  const showCellNames = importBooleanFromEnterprise(context, undefined, data.ОтображатьИменаЯчеек)
  if (showCellNames !== undefined) result.showCellNames = showCellNames

  const showGrid = importBooleanFromEnterprise(context, undefined, data.ОтображатьСетку)
  if (showGrid !== undefined) result.showGrid = showGrid

  const statePresentation = importSystemEnumerationFromYAML<SE.StatePresentation>(
    context,
    data.ОтображениеСостояния,
    SE.StatePresentationFromEnterprise
  )
  if (statePresentation !== undefined) result.statePresentation = statePresentation

  const enableStartDrag = importBooleanFromEnterprise(context, undefined, data.РазрешитьНачалоПеретаскивания)
  if (enableStartDrag !== undefined) result.enableStartDrag = enableStartDrag

  const enableDrag = importBooleanFromEnterprise(context, undefined, data.РазрешитьПеретаскивание)
  if (enableDrag !== undefined) result.enableDrag = enableDrag

  const verticalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const edit = importBooleanFromEnterprise(context, undefined, data.Редактирование)
  if (edit !== undefined) result.edit = edit

  const viewScalingMode = importSystemEnumerationFromYAML<SE.ViewScalingMode>(
    context,
    data.РежимМасштабированияПросмотра,
    SE.ViewScalingModeFromEnterprise
  )
  if (viewScalingMode !== undefined) result.viewScalingMode = viewScalingMode

  const selectionShowMode = importSystemEnumerationFromYAML<SE.SelectionShowMode>(
    context,
    data.РежимОтображенияВыделения,
    SE.SelectionShowModeFromEnterprise
  )
  if (selectionShowMode !== undefined) result.selectionShowMode = selectionShowMode

  const drawingSelectionShowMode = importSystemEnumerationFromYAML<SE.DrawingSelectionShowMode>(
    context,
    data.РежимОтображенияВыделенияРисунков,
    SE.DrawingSelectionShowModeFromEnterprise
  )
  if (drawingSelectionShowMode !== undefined) result.drawingSelectionShowMode = drawingSelectionShowMode

  const pointerType = importSystemEnumerationFromYAML<SE.SpreadsheetDocumentPointerType>(
    context,
    data.ТипКурсоров,
    SE.SpreadsheetDocumentPointerTypeFromEnterprise
  )
  if (pointerType !== undefined) result.pointerType = pointerType

  const borderColor = importColorFromEnterprise(context, undefined, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const blackAndWhiteView = importBooleanFromEnterprise(context, undefined, data.ЧерноБелыйПросмотр)
  if (blackAndWhiteView !== undefined) result.blackAndWhiteView = blackAndWhiteView

  if (data.Ширина !== undefined) result.width = data.Ширина

  if (data.Таблица !== undefined) result.table = data.Таблица

  const events = importEventsFromEnterprise(context, undefined, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "SpreadSheetDocumentField",
  importSpreadSheetDocumentFieldPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
