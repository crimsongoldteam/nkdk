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
  configurationSettings: Context,
  data: SpreadSheetDocumentField | undefined
): SpreadSheetDocumentFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(configurationSettings, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(configurationSettings, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(configurationSettings, data.autoMaxWidth),
    ВертикальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.verticalScrollBar,
      SE.ScrollBarUseToEnterprise
    ),
    Вывод: exportSystemEnumerationToEnterprise(configurationSettings, data.output, SE.UseOutputToEnterprise),
    Высота: data.height,
    ГоризонтальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.horizontalScrollBar,
      SE.ScrollBarUseToEnterprise
    ),
    Защита: exportBooleanToEnterprise(configurationSettings, data.protection),
    ИспользуемоеИмяФайла: data.usedFileName,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ОтображатьГруппировки: exportBooleanToEnterprise(configurationSettings, data.showGroups),
    ОтображатьЗаголовки: exportBooleanToEnterprise(configurationSettings, data.showHeaders),
    ОтображатьИменаСтрокИКолонок: exportBooleanToEnterprise(configurationSettings, data.showRowAndColumnNames),
    ОтображатьИменаЯчеек: exportBooleanToEnterprise(configurationSettings, data.showCellNames),
    ОтображатьСетку: exportBooleanToEnterprise(configurationSettings, data.showGrid),
    ОтображениеСостояния: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.statePresentation,
      SE.StatePresentationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(configurationSettings, data.enableStartDrag),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(configurationSettings, data.enableDrag),
    РастягиватьПоВертикали: exportBooleanToEnterprise(configurationSettings, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(configurationSettings, data.horizontalStretch),
    Редактирование: exportBooleanToEnterprise(configurationSettings, data.edit),
    РежимМасштабированияПросмотра: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.viewScalingMode,
      SE.ViewScalingModeToEnterprise
    ),
    РежимОтображенияВыделения: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.selectionShowMode,
      SE.SelectionShowModeToEnterprise
    ),
    РежимОтображенияВыделенияРисунков: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.drawingSelectionShowMode,
      SE.DrawingSelectionShowModeToEnterprise
    ),
    ТипКурсоров: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.pointerType,
      SE.SpreadsheetDocumentPointerTypeToEnterprise
    ),
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    ЧерноБелыйПросмотр: exportBooleanToEnterprise(configurationSettings, data.blackAndWhiteView),
    Ширина: data.width,
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "SpreadSheetDocumentField", exportSpreadSheetDocumentFieldToEnterprise)
