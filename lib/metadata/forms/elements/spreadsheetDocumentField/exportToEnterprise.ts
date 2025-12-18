import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
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
  data: SpreadSheetDocumentField | undefined,
  configurationSettings: ConfigurationSettings
): SpreadSheetDocumentFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(data, configurationSettings)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    ЧерноБелыйПросмотр: exportBooleanToEnterprise(data.blackAndWhiteView, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    РежимОтображенияВыделенияРисунков: exportSystemEnumerationToEnterprise(
      data.drawingSelectionShowMode,
      SE.DrawingSelectionShowModeToEnterprise,
      configurationSettings
    ),
    Редактирование: exportBooleanToEnterprise(data.edit, configurationSettings),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag, configurationSettings),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag, configurationSettings),
    Высота: data.height,
    ГоризонтальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      data.horizontalScrollBar,
      SE.ScrollBarUseToEnterprise,
      configurationSettings
    ),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    Вывод: exportSystemEnumerationToEnterprise(data.output, SE.UseOutputToEnterprise, configurationSettings),
    ТипКурсоров: exportSystemEnumerationToEnterprise(
      data.pointerType,
      SE.SpreadsheetDocumentPointerTypeToEnterprise,
      configurationSettings
    ),
    Защита: exportBooleanToEnterprise(data.protection, configurationSettings),
    РежимОтображенияВыделения: exportSystemEnumerationToEnterprise(
      data.selectionShowMode,
      SE.SelectionShowModeToEnterprise,
      configurationSettings
    ),
    ОтображатьИменаЯчеек: exportBooleanToEnterprise(data.showCellNames, configurationSettings),
    ОтображатьСетку: exportBooleanToEnterprise(data.showGrid, configurationSettings),
    ОтображатьГруппировки: exportBooleanToEnterprise(data.showGroups, configurationSettings),
    ОтображатьЗаголовки: exportBooleanToEnterprise(data.showHeaders, configurationSettings),
    ОтображатьИменаСтрокИКолонок: exportBooleanToEnterprise(data.showRowAndColumnNames, configurationSettings),
    ОтображениеСостояния: exportSystemEnumerationToEnterprise(
      data.statePresentation,
      SE.StatePresentationToEnterprise,
      configurationSettings
    ),
    ИспользуемоеИмяФайла: data.usedFileName,
    ВертикальнаяПолосаПрокрутки: exportSystemEnumerationToEnterprise(
      data.verticalScrollBar,
      SE.ScrollBarUseToEnterprise,
      configurationSettings
    ),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    РежимМасштабированияПросмотра: exportSystemEnumerationToEnterprise(
      data.viewScalingMode,
      SE.ViewScalingModeToEnterprise,
      configurationSettings
    ),
    Ширина: data.width,
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "SpreadSheetDocumentField", exportSpreadSheetDocumentFieldToEnterprise)
