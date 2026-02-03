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
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
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
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../calendarField/rules"
import { exportContextMenuToEnterprise } from "../contextMenu/exportToEnterprise"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"

export function exportSpreadSheetDocumentFieldTypedToEnterprise<From extends SpreadSheetDocumentField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToTypedEnterpriseType<From> {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const props = exportSpreadSheetDocumentFieldPropsToEnterprise(context, undefined, data)

  const result: SpreadSheetDocumentFieldTypedEnterprise = {
    Тип: "ПолеТабличногоДокумента",
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export function exportSpreadSheetDocumentFieldPartialToEnterprise<From extends SpreadSheetDocumentField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToPartialEnterpriseType<From> {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const props = exportSpreadSheetDocumentFieldPropsToEnterprise(context, undefined, data)

  const result: SpreadSheetDocumentFieldPartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportSpreadSheetDocumentFieldPropsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: SpreadSheetDocumentField
): SpreadSheetDocumentFieldPartialEnterprise => {
  const result: SpreadSheetDocumentFieldPartialEnterprise = {}

  const autoCellHeight = exportBooleanToEnterprise(context, undefined, data.autoCellHeight)
  if (autoCellHeight !== undefined) result.АвтоВысотаЯчейки = autoCellHeight

  const defaultItem = exportBooleanToEnterprise(context, undefined, data.defaultItem)
  if (defaultItem !== undefined) result.АктивизироватьПоУмолчанию = defaultItem

  const displayImportance = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalAlign = exportSystemEnumerationToYAML(
    context,
    undefined,
    undefined,
    data.verticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlign !== undefined) result.ВертикальноеПоложение = verticalAlign

  const verticalAlignInGroup = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const type = exportSystemEnumerationToYAML(context, undefined, data.type, SE.FormFieldTypeToEnterprise)
  if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, undefined, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.titleHeight !== undefined) result.ВысотаЗаголовка = data.titleHeight

  const cellHyperlink = exportBooleanToEnterprise(context, undefined, data.cellHyperlink)
  if (cellHyperlink !== undefined) result.ГиперссылкаЯчейки = cellHyperlink

  const horizontalAlign = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.horizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  const horizontalAlignInGroup = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const footerHorizontalAlign = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.footerHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (footerHorizontalAlign !== undefined) result.ГоризонтальноеПоложениеВПодвале = footerHorizontalAlign

  const headerHorizontalAlign = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.headerHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (headerHorizontalAlign !== undefined) result.ГоризонтальноеПоложениеВШапке = headerHorizontalAlign

  const enabled = exportBooleanToEnterprise(context, undefined, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const footerPicture = exportPictureToEnterprise(context, undefined, data.footerPicture)
  if (footerPicture !== undefined) result.КартинкаПодвала = footerPicture

  const headerPicture = exportPictureToEnterprise(context, undefined, data.headerPicture)
  if (headerPicture !== undefined) result.КартинкаШапки = headerPicture

  const contextMenu = exportContextMenuToEnterprise(context, undefined, data.contextMenu)
  if (contextMenu !== undefined) result.КонтекстноеМеню = contextMenu

  const typeRestriction = exportTypeDescriptionToEnterprise(context, undefined, data.typeRestriction)
  if (typeRestriction !== undefined) result.ОграничениеТипа = typeRestriction

  const showInFooter = exportBooleanToEnterprise(context, undefined, data.showInFooter)
  if (showInFooter !== undefined) result.ОтображатьВПодвале = showInFooter

  const showInHeader = exportBooleanToEnterprise(context, undefined, data.showInHeader)
  if (showInHeader !== undefined) result.ОтображатьВШапке = showInHeader

  const toolTipRepresentation = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const warningOnEditRepresentation = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.warningOnEditRepresentation,
    SE.WarningOnEditRepresentationToEnterprise
  )
  if (warningOnEditRepresentation !== undefined)
    result.ОтображениеПредупрежденияПриРедактировании = warningOnEditRepresentation

  const toolTip = exportI8nTextToEnterprise(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const titleLocation = exportSystemEnumerationToYAML(
    context,
    undefined,
    undefined,
    data.titleLocation,
    SE.FormItemTitleLocationToEnterprise
  )
  if (titleLocation !== undefined) result.ПоложениеЗаголовка = titleLocation

  const warningOnEdit = exportI8nTextToEnterprise(context, undefined, data.warningOnEdit)
  if (warningOnEdit !== undefined) result.ПредупреждениеПриРедактировании = warningOnEdit

  const skipOnInput = exportBooleanToEnterprise(context, undefined, data.skipOnInput)
  if (skipOnInput !== undefined) result.ПропускатьПриВводе = skipOnInput

  if (data.dataPath !== undefined) result.ПутьКДанным = data.dataPath

  if (data.footerDataPath !== undefined) result.ПутьКДаннымПодвала = data.footerDataPath

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, undefined, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  const editMode = exportSystemEnumerationToYAML(context, undefined, data.editMode, SE.ColumnEditModeToEnterprise)
  if (editMode !== undefined) result.РежимРедактирования = editMode

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  if (data.table !== undefined) result.Таблица = data.table

  const footerText = exportI8nTextToEnterprise(context, undefined, data.footerText)
  if (footerText !== undefined) result.ТекстПодвала = footerText

  const readOnly = exportBooleanToEnterprise(context, undefined, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const fixingInTable = exportSystemEnumerationToYAML(
    context,
    undefined,
    undefined,
    data.fixingInTable,
    SE.FixingInTableToEnterprise
  )
  if (fixingInTable !== undefined) result.ФиксацияВТаблице = fixingInTable

  const titleTextColor = exportColorToEnterprise(context, undefined, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  const footerTextColor = exportColorToEnterprise(context, undefined, data.footerTextColor)
  if (footerTextColor !== undefined) result.ЦветТекстаПодвала = footerTextColor

  const titleBackColor = exportColorToEnterprise(context, undefined, data.titleBackColor)
  if (titleBackColor !== undefined) result.ЦветФонаЗаголовка = titleBackColor

  const footerBackColor = exportColorToEnterprise(context, undefined, data.footerBackColor)
  if (footerBackColor !== undefined) result.ЦветФонаПодвала = footerBackColor

  const titleFont = exportFontToEnterprise(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  const footerFont = exportFontToEnterprise(context, undefined, data.footerFont)
  if (footerFont !== undefined) result.ШрифтПодвала = footerFont

  const autoMaxHeight = exportBooleanToEnterprise(context, undefined, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, undefined, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const verticalScrollBar = exportSystemEnumerationToYAML(
    context,
    undefined,
    undefined,
    data.verticalScrollBar,
    SE.ScrollBarUseToEnterprise
  )
  if (verticalScrollBar !== undefined) result.ВертикальнаяПолосаПрокрутки = verticalScrollBar

  const output = exportSystemEnumerationToYAML(context, undefined, data.output, SE.UseOutputToEnterprise)
  if (output !== undefined) result.Вывод = output

  if (data.height !== undefined) result.Высота = data.height

  const horizontalScrollBar = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.horizontalScrollBar,
    SE.ScrollBarUseToEnterprise
  )
  if (horizontalScrollBar !== undefined) result.ГоризонтальнаяПолосаПрокрутки = horizontalScrollBar

  const protection = exportBooleanToEnterprise(context, undefined, data.protection)
  if (protection !== undefined) result.Защита = protection

  if (data.usedFileName !== undefined) result.ИспользуемоеИмяФайла = data.usedFileName

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const showGroups = exportBooleanToEnterprise(context, undefined, data.showGroups)
  if (showGroups !== undefined) result.ОтображатьГруппировки = showGroups

  const showHeaders = exportBooleanToEnterprise(context, undefined, data.showHeaders)
  if (showHeaders !== undefined) result.ОтображатьЗаголовки = showHeaders

  const showRowAndColumnNames = exportBooleanToEnterprise(context, undefined, data.showRowAndColumnNames)
  if (showRowAndColumnNames !== undefined) result.ОтображатьИменаСтрокИКолонок = showRowAndColumnNames

  const showCellNames = exportBooleanToEnterprise(context, undefined, data.showCellNames)
  if (showCellNames !== undefined) result.ОтображатьИменаЯчеек = showCellNames

  const showGrid = exportBooleanToEnterprise(context, undefined, data.showGrid)
  if (showGrid !== undefined) result.ОтображатьСетку = showGrid

  const statePresentation = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.statePresentation,
    SE.StatePresentationToEnterprise
  )
  if (statePresentation !== undefined) result.ОтображениеСостояния = statePresentation

  const userVisible = exportUserVisibleToEnterprise(context, undefined, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const enableStartDrag = exportBooleanToEnterprise(context, undefined, data.enableStartDrag)
  if (enableStartDrag !== undefined) result.РазрешитьНачалоПеретаскивания = enableStartDrag

  const enableDrag = exportBooleanToEnterprise(context, undefined, data.enableDrag)
  if (enableDrag !== undefined) result.РазрешитьПеретаскивание = enableDrag

  const verticalStretch = exportBooleanToEnterprise(context, undefined, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, undefined, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const edit = exportBooleanToEnterprise(context, undefined, data.edit)
  if (edit !== undefined) result.Редактирование = edit

  const viewScalingMode = exportSystemEnumerationToYAML(
    context,
    undefined,
    undefined,
    data.viewScalingMode,
    SE.ViewScalingModeToEnterprise
  )
  if (viewScalingMode !== undefined) result.РежимМасштабированияПросмотра = viewScalingMode

  const selectionShowMode = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.selectionShowMode,
    SE.SelectionShowModeToEnterprise
  )
  if (selectionShowMode !== undefined) result.РежимОтображенияВыделения = selectionShowMode

  const drawingSelectionShowMode = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.drawingSelectionShowMode,
    SE.DrawingSelectionShowModeToEnterprise
  )
  if (drawingSelectionShowMode !== undefined) result.РежимОтображенияВыделенияРисунков = drawingSelectionShowMode

  const pointerType = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.pointerType,
    SE.SpreadsheetDocumentPointerTypeToEnterprise
  )
  if (pointerType !== undefined) result.ТипКурсоров = pointerType

  const borderColor = exportColorToEnterprise(context, undefined, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const blackAndWhiteView = exportBooleanToEnterprise(context, undefined, data.blackAndWhiteView)
  if (blackAndWhiteView !== undefined) result.ЧерноБелыйПросмотр = blackAndWhiteView

  if (data.width !== undefined) result.Ширина = data.width

  const events = exportEventsToEnterprise(context, undefined, data.events)
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
