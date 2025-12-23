import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldEnterprise,
} from "~/lib/metadata/forms/elements/spreadSheetDocumentField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportSpreadSheetDocumentFieldToEnterprise = (
  context: Context,
  data: SpreadSheetDocumentField | undefined
): SpreadSheetDocumentFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(context, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    ВертикальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      context,
      data.verticalScrollBar,
      SE.ScrollBarUseToEnterprise
    ),
    Вывод: exportSystemEnumerationToEnterprise(context, data.output, SE.UseOutputToEnterprise),
    Высота: data.height,
    ГоризонтальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      context,
      data.horizontalScrollBar,
      SE.ScrollBarUseToEnterprise
    ),
    Защита: exportBooleanToEnterprise(context, data.protection),
    ИспользуемоеИмяФайла: data.usedFileName,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ОтображатьГруппировки: exportBooleanToEnterprise(context, data.showGroups),
    ОтображатьЗаголовки: exportBooleanToEnterprise(context, data.showHeaders),
    ОтображатьИменаСтрокИКолонок: exportBooleanToEnterprise(context, data.showRowAndColumnNames),
    ОтображатьИменаЯчеек: exportBooleanToEnterprise(context, data.showCellNames),
    ОтображатьСетку: exportBooleanToEnterprise(context, data.showGrid),
    ОтображениеСостояния: exportSystemEnumerationToEnterprise(
      context,
      data.statePresentation,
      SE.StatePresentationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(context, data.enableStartDrag),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(context, data.enableDrag),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    Редактирование: exportBooleanToEnterprise(context, data.edit),
    РежимМасштабированияПросмотра: exportSystemEnumerationToEnterprise(
      context,
      data.viewScalingMode,
      SE.ViewScalingModeToEnterprise
    ),
    РежимОтображенияВыделения: exportSystemEnumerationToEnterprise(
      context,
      data.selectionShowMode,
      SE.SelectionShowModeToEnterprise
    ),
    РежимОтображенияВыделенияРисунков: exportSystemEnumerationToEnterprise(
      context,
      data.drawingSelectionShowMode,
      SE.DrawingSelectionShowModeToEnterprise
    ),
    ТипКурсоров: exportSystemEnumerationToEnterprise(
      context,
      data.pointerType,
      SE.SpreadsheetDocumentPointerTypeToEnterprise
    ),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЧерноБелыйПросмотр: exportBooleanToEnterprise(context, data.blackAndWhiteView),
    Ширина: data.width,
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "SpreadSheetDocumentField", exportSpreadSheetDocumentFieldToEnterprise)
