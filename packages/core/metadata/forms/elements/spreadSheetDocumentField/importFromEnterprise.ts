import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialEnterprise,
  SpreadSheetDocumentFieldTypedEnterprise,
} from "~/metadata/forms/elements/spreadSheetDocumentField/types"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  importFormElementTypeFromEnterprise,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export function importSpreadSheetDocumentFieldTypedFromEnterprise<To extends SpreadSheetDocumentField | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const props = importSpreadSheetDocumentFieldPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: SpreadSheetDocumentField = {
    ...baseFields,
    ...props,
    elementType,
  }

  return result as To
}

export function importSpreadSheetDocumentFieldPartialFromEnterprise<To extends SpreadSheetDocumentField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const baseFields = importFormFieldFromEnterprise(context, data, source.name)!

  const props = importSpreadSheetDocumentFieldPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...baseFields,
    ...props,
    elementType: source.elementType, // Сохраняем elementType из source
  }

  return result
}

const importSpreadSheetDocumentFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: SpreadSheetDocumentFieldTypedEnterprise | SpreadSheetDocumentFieldPartialEnterprise | undefined
): Omit<Partial<SpreadSheetDocumentField>, "elementType" | "name"> => {
  const result: Omit<Partial<SpreadSheetDocumentField>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const verticalScrollBar = importSystemEnumerationFromEnterprise<SE.ScrollBarUse>(
    context,
    data.ВертикальнаяПолосаПрокрутки,
    SE.ScrollBarUseFromEnterprise
  )
  if (verticalScrollBar !== undefined) result.verticalScrollBar = verticalScrollBar

  const output = importSystemEnumerationFromEnterprise<SE.UseOutput>(context, data.Вывод, SE.UseOutputFromEnterprise)
  if (output !== undefined) result.output = output

  if (data.Высота !== undefined) result.height = data.Высота

  const horizontalScrollBar = importSystemEnumerationFromEnterprise<SE.ScrollBarUse>(
    context,
    data.ГоризонтальнаяПолосаПрокрутки,
    SE.ScrollBarUseFromEnterprise
  )
  if (horizontalScrollBar !== undefined) result.horizontalScrollBar = horizontalScrollBar

  const protection = importBooleanFromEnterprise(context, data.Защита)
  if (protection !== undefined) result.protection = protection

  if (data.ИспользуемоеИмяФайла !== undefined) result.usedFileName = data.ИспользуемоеИмяФайла

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const showGroups = importBooleanFromEnterprise(context, data.ОтображатьГруппировки)
  if (showGroups !== undefined) result.showGroups = showGroups

  const showHeaders = importBooleanFromEnterprise(context, data.ОтображатьЗаголовки)
  if (showHeaders !== undefined) result.showHeaders = showHeaders

  const showRowAndColumnNames = importBooleanFromEnterprise(context, data.ОтображатьИменаСтрокИКолонок)
  if (showRowAndColumnNames !== undefined) result.showRowAndColumnNames = showRowAndColumnNames

  const showCellNames = importBooleanFromEnterprise(context, data.ОтображатьИменаЯчеек)
  if (showCellNames !== undefined) result.showCellNames = showCellNames

  const showGrid = importBooleanFromEnterprise(context, data.ОтображатьСетку)
  if (showGrid !== undefined) result.showGrid = showGrid

  const statePresentation = importSystemEnumerationFromEnterprise<SE.StatePresentation>(
    context,
    data.ОтображениеСостояния,
    SE.StatePresentationFromEnterprise
  )
  if (statePresentation !== undefined) result.statePresentation = statePresentation

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const enableStartDrag = importBooleanFromEnterprise(context, data.РазрешитьНачалоПеретаскивания)
  if (enableStartDrag !== undefined) result.enableStartDrag = enableStartDrag

  const enableDrag = importBooleanFromEnterprise(context, data.РазрешитьПеретаскивание)
  if (enableDrag !== undefined) result.enableDrag = enableDrag

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const edit = importBooleanFromEnterprise(context, data.Редактирование)
  if (edit !== undefined) result.edit = edit

  const viewScalingMode = importSystemEnumerationFromEnterprise<SE.ViewScalingMode>(
    context,
    data.РежимМасштабированияПросмотра,
    SE.ViewScalingModeFromEnterprise
  )
  if (viewScalingMode !== undefined) result.viewScalingMode = viewScalingMode

  const selectionShowMode = importSystemEnumerationFromEnterprise<SE.SelectionShowMode>(
    context,
    data.РежимОтображенияВыделения,
    SE.SelectionShowModeFromEnterprise
  )
  if (selectionShowMode !== undefined) result.selectionShowMode = selectionShowMode

  const drawingSelectionShowMode = importSystemEnumerationFromEnterprise<SE.DrawingSelectionShowMode>(
    context,
    data.РежимОтображенияВыделенияРисунков,
    SE.DrawingSelectionShowModeFromEnterprise
  )
  if (drawingSelectionShowMode !== undefined) result.drawingSelectionShowMode = drawingSelectionShowMode

  const pointerType = importSystemEnumerationFromEnterprise<SE.SpreadsheetDocumentPointerType>(
    context,
    data.ТипКурсоров,
    SE.SpreadsheetDocumentPointerTypeFromEnterprise
  )
  if (pointerType !== undefined) result.pointerType = pointerType

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const blackAndWhiteView = importBooleanFromEnterprise(context, data.ЧерноБелыйПросмотр)
  if (blackAndWhiteView !== undefined) result.blackAndWhiteView = blackAndWhiteView

  if (data.Ширина !== undefined) result.width = data.Ширина

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "SpreadSheetDocumentField",
  importSpreadSheetDocumentFieldPropsFromEnterprise
)
