import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialEnterprise,
  SpreadSheetDocumentFieldTypedEnterprise,
} from "~/metadata/forms/elements/spreadSheetDocumentField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ExportPartialToEnterpriseFn,
  ExportTypedToEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportContextMenuToEnterprise } from "../contextMenu/exportToEnterprise"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"
import { exportTableToEnterprise } from "../table/exportToEnterprise"

export function exportSpreadSheetDocumentFieldTypedToEnterprise<From extends SpreadSheetDocumentField | undefined>(
  context: ConfigurationContext,
  data: From
): ToTypedEnterpriseType<From> {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const props = exportSpreadSheetDocumentFieldPropsToEnterprise(context, data)

  const result: SpreadSheetDocumentFieldTypedEnterprise = {
    Тип: "ПолеТабличногоДокумента",
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export function exportSpreadSheetDocumentFieldPartialToEnterprise<From extends SpreadSheetDocumentField | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const props = exportSpreadSheetDocumentFieldPropsToEnterprise(context, data)

  const result: SpreadSheetDocumentFieldPartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportSpreadSheetDocumentFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: SpreadSheetDocumentField
): SpreadSheetDocumentFieldPartialEnterprise => {
  const result: SpreadSheetDocumentFieldPartialEnterprise = {}

  const autoCellHeight = exportBooleanToEnterprise(context, data.autoCellHeight)
  if (autoCellHeight !== undefined) result.АвтоВысотаЯчейки = autoCellHeight

  const defaultItem = exportBooleanToEnterprise(context, data.defaultItem)
  if (defaultItem !== undefined) result.АктивизироватьПоУмолчанию = defaultItem

  const displayImportance = exportSystemEnumerationToEnterprise(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.verticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlign !== undefined) result.ВертикальноеПоложение = verticalAlign

  const verticalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const type = exportSystemEnumerationToEnterprise(context, data.type, SE.FormFieldTypeToEnterprise)
  if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.titleHeight !== undefined) result.ВысотаЗаголовка = data.titleHeight

  const cellHyperlink = exportBooleanToEnterprise(context, data.cellHyperlink)
  if (cellHyperlink !== undefined) result.ГиперссылкаЯчейки = cellHyperlink

  const horizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  const horizontalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const footerHorizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.footerHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (footerHorizontalAlign !== undefined) result.ГоризонтальноеПоложениеВПодвале = footerHorizontalAlign

  const headerHorizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.headerHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (headerHorizontalAlign !== undefined) result.ГоризонтальноеПоложениеВШапке = headerHorizontalAlign

  const enabled = exportBooleanToEnterprise(context, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const footerPicture = exportPictureToEnterprise(context, data.footerPicture)
  if (footerPicture !== undefined) result.КартинкаПодвала = footerPicture

  const headerPicture = exportPictureToEnterprise(context, data.headerPicture)
  if (headerPicture !== undefined) result.КартинкаШапки = headerPicture

  const contextMenu = exportContextMenuToEnterprise(context, data.contextMenu)
  if (contextMenu !== undefined) result.КонтекстноеМеню = contextMenu

  const typeRestriction = exportTypeDescriptionToEnterprise(context, data.typeRestriction)
  if (typeRestriction !== undefined) result.ОграничениеТипа = typeRestriction

  const showInFooter = exportBooleanToEnterprise(context, data.showInFooter)
  if (showInFooter !== undefined) result.ОтображатьВПодвале = showInFooter

  const showInHeader = exportBooleanToEnterprise(context, data.showInHeader)
  if (showInHeader !== undefined) result.ОтображатьВШапке = showInHeader

  const toolTipRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const warningOnEditRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.warningOnEditRepresentation,
    SE.WarningOnEditRepresentationToEnterprise
  )
  if (warningOnEditRepresentation !== undefined)
    result.ОтображениеПредупрежденияПриРедактировании = warningOnEditRepresentation

  const toolTip = exportI8nTextToEnterprise(context, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const titleLocation = exportSystemEnumerationToEnterprise(
    context,
    data.titleLocation,
    SE.FormItemTitleLocationToEnterprise
  )
  if (titleLocation !== undefined) result.ПоложениеЗаголовка = titleLocation

  const warningOnEdit = exportI8nTextToEnterprise(context, data.warningOnEdit)
  if (warningOnEdit !== undefined) result.ПредупреждениеПриРедактировании = warningOnEdit

  const skipOnInput = exportBooleanToEnterprise(context, data.skipOnInput)
  if (skipOnInput !== undefined) result.ПропускатьПриВводе = skipOnInput

  if (data.dataPath !== undefined) result.ПутьКДанным = data.dataPath

  if (data.footerDataPath !== undefined) result.ПутьКДаннымПодвала = data.footerDataPath

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  const editMode = exportSystemEnumerationToEnterprise(context, data.editMode, SE.ColumnEditModeToEnterprise)
  if (editMode !== undefined) result.РежимРедактирования = editMode

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const table = exportTableToEnterprise(context, data.table)
  if (table !== undefined) result.Таблица = table

  const footerText = exportI8nTextToEnterprise(context, data.footerText)
  if (footerText !== undefined) result.ТекстПодвала = footerText

  const readOnly = exportBooleanToEnterprise(context, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const fixingInTable = exportSystemEnumerationToEnterprise(context, data.fixingInTable, SE.FixingInTableToEnterprise)
  if (fixingInTable !== undefined) result.ФиксацияВТаблице = fixingInTable

  const titleTextColor = exportColorToEnterprise(context, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  const footerTextColor = exportColorToEnterprise(context, data.footerTextColor)
  if (footerTextColor !== undefined) result.ЦветТекстаПодвала = footerTextColor

  const titleBackColor = exportColorToEnterprise(context, data.titleBackColor)
  if (titleBackColor !== undefined) result.ЦветФонаЗаголовка = titleBackColor

  const footerBackColor = exportColorToEnterprise(context, data.footerBackColor)
  if (footerBackColor !== undefined) result.ЦветФонаПодвала = footerBackColor

  const titleFont = exportFontToEnterprise(context, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  const footerFont = exportFontToEnterprise(context, data.footerFont)
  if (footerFont !== undefined) result.ШрифтПодвала = footerFont

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const verticalScrollBar = exportSystemEnumerationToEnterprise(
    context,
    data.verticalScrollBar,
    SE.ScrollBarUseToEnterprise
  )
  if (verticalScrollBar !== undefined) result.ВертикальнаяПолосаПрокрутки = verticalScrollBar

  const output = exportSystemEnumerationToEnterprise(context, data.output, SE.UseOutputToEnterprise)
  if (output !== undefined) result.Вывод = output

  if (data.height !== undefined) result.Высота = data.height

  const horizontalScrollBar = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalScrollBar,
    SE.ScrollBarUseToEnterprise
  )
  if (horizontalScrollBar !== undefined) result.ГоризонтальнаяПолосаПрокрутки = horizontalScrollBar

  const protection = exportBooleanToEnterprise(context, data.protection)
  if (protection !== undefined) result.Защита = protection

  if (data.usedFileName !== undefined) result.ИспользуемоеИмяФайла = data.usedFileName

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const showGroups = exportBooleanToEnterprise(context, data.showGroups)
  if (showGroups !== undefined) result.ОтображатьГруппировки = showGroups

  const showHeaders = exportBooleanToEnterprise(context, data.showHeaders)
  if (showHeaders !== undefined) result.ОтображатьЗаголовки = showHeaders

  const showRowAndColumnNames = exportBooleanToEnterprise(context, data.showRowAndColumnNames)
  if (showRowAndColumnNames !== undefined) result.ОтображатьИменаСтрокИКолонок = showRowAndColumnNames

  const showCellNames = exportBooleanToEnterprise(context, data.showCellNames)
  if (showCellNames !== undefined) result.ОтображатьИменаЯчеек = showCellNames

  const showGrid = exportBooleanToEnterprise(context, data.showGrid)
  if (showGrid !== undefined) result.ОтображатьСетку = showGrid

  const statePresentation = exportSystemEnumerationToEnterprise(
    context,
    data.statePresentation,
    SE.StatePresentationToEnterprise
  )
  if (statePresentation !== undefined) result.ОтображениеСостояния = statePresentation

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const enableStartDrag = exportBooleanToEnterprise(context, data.enableStartDrag)
  if (enableStartDrag !== undefined) result.РазрешитьНачалоПеретаскивания = enableStartDrag

  const enableDrag = exportBooleanToEnterprise(context, data.enableDrag)
  if (enableDrag !== undefined) result.РазрешитьПеретаскивание = enableDrag

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const edit = exportBooleanToEnterprise(context, data.edit)
  if (edit !== undefined) result.Редактирование = edit

  const viewScalingMode = exportSystemEnumerationToEnterprise(
    context,
    data.viewScalingMode,
    SE.ViewScalingModeToEnterprise
  )
  if (viewScalingMode !== undefined) result.РежимМасштабированияПросмотра = viewScalingMode

  const selectionShowMode = exportSystemEnumerationToEnterprise(
    context,
    data.selectionShowMode,
    SE.SelectionShowModeToEnterprise
  )
  if (selectionShowMode !== undefined) result.РежимОтображенияВыделения = selectionShowMode

  const drawingSelectionShowMode = exportSystemEnumerationToEnterprise(
    context,
    data.drawingSelectionShowMode,
    SE.DrawingSelectionShowModeToEnterprise
  )
  if (drawingSelectionShowMode !== undefined) result.РежимОтображенияВыделенияРисунков = drawingSelectionShowMode

  const pointerType = exportSystemEnumerationToEnterprise(
    context,
    data.pointerType,
    SE.SpreadsheetDocumentPointerTypeToEnterprise
  )
  if (pointerType !== undefined) result.ТипКурсоров = pointerType

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const blackAndWhiteView = exportBooleanToEnterprise(context, data.blackAndWhiteView)
  if (blackAndWhiteView !== undefined) result.ЧерноБелыйПросмотр = blackAndWhiteView

  if (data.width !== undefined) result.Ширина = data.width

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata(
  "ExportPartialToEnterprise",
  "SpreadSheetDocumentField",
  exportSpreadSheetDocumentFieldPartialToEnterprise as ExportPartialToEnterpriseFn
)
registerMetadata(
  "ExportTypedToEnterprise",
  "SpreadSheetDocumentField",
  exportSpreadSheetDocumentFieldTypedToEnterprise as ExportTypedToEnterpriseFn
)
