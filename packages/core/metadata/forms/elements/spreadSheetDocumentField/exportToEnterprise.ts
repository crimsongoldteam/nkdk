import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldEnterprise,
} from "~/metadata/forms/elements/spreadSheetDocumentField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportSpreadSheetDocumentFieldToEnterprise = (
  context: ConfigurationContext,
  data: SpreadSheetDocumentField | undefined
): SpreadSheetDocumentFieldEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToEnterprise(context, data)
  if (!baseFields) return undefined

  const result: SpreadSheetDocumentFieldEnterprise = {
    ...baseFields,
  }

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

registerMetadata("ExportToEnterprise", "SpreadSheetDocumentField", exportSpreadSheetDocumentFieldToEnterprise)
