import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldEnterprise,
} from "~/lib/metadata/forms/elements/spreadSheetDocumentField/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportSpreadSheetDocumentFieldToEnterprise = (
  data: SpreadSheetDocumentField | undefined
): SpreadSheetDocumentFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    ЧерноБелыйПросмотр: exportBooleanToEnterprise(data.blackAndWhiteView),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    РежимОтображенияВыделенияРисунков: exportSystemEnumerationToEnterprise(
      data.drawingSelectionShowMode,
      SE.DrawingSelectionShowModeToEnterprise
    ),
    Редактирование: exportBooleanToEnterprise(data.edit),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag),
    Высота: data.height,
    ГоризонтальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      data.horizontalScrollBar,
      SE.ScrollBarUseToEnterprise
    ),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    Вывод: exportSystemEnumerationToEnterprise(data.output, SE.UseOutputToEnterprise),
    ТипКурсоров: exportSystemEnumerationToEnterprise(data.pointerType, SE.SpreadsheetDocumentPointerTypeToEnterprise),
    Защита: exportBooleanToEnterprise(data.protection),
    РежимОтображенияВыделения: exportSystemEnumerationToEnterprise(
      data.selectionShowMode,
      SE.SelectionShowModeToEnterprise
    ),
    ОтображатьИменаЯчеек: exportBooleanToEnterprise(data.showCellNames),
    ОтображатьСетку: exportBooleanToEnterprise(data.showGrid),
    ОтображатьГруппировки: exportBooleanToEnterprise(data.showGroups),
    ОтображатьЗаголовки: exportBooleanToEnterprise(data.showHeaders),
    ОтображатьИменаСтрокИКолонок: exportBooleanToEnterprise(data.showRowAndColumnNames),
    ОтображениеСостояния: exportSystemEnumerationToEnterprise(data.statePresentation, SE.StatePresentationToEnterprise),
    ИспользуемоеИмяФайла: data.usedFileName,
    ВертикальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      data.verticalScrollBar,
      SE.ScrollBarUseToEnterprise
    ),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    РежимМасштабированияПросмотра: exportSystemEnumerationToEnterprise(
      data.viewScalingMode,
      SE.ViewScalingModeToEnterprise
    ),
    Ширина: data.width,
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.SpreadSheetDocumentField, exportSpreadSheetDocumentFieldToEnterprise)
