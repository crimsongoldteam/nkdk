import { colorRule } from "~/metadata/commonObjects/color/types"
import { dataPathRule } from "~/metadata/commonObjects/metadataPath/types"
import { commandSetRule } from "~/metadata/forms/commonObjects/commandSet/types"
import { eventsRule } from "~/metadata/forms/commonObjects/event/types"
import { scrollBarUseBooleanRule } from "~/metadata/forms/commonObjects/scrollBarUse/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const SpreadSheetDocumentFieldRules = {
  itemType: "SpreadSheetDocumentField",
  enterpriseFieldType: "FormFieldType.SpreadsheetDocumentField",
  enterpriseField: "FormField",
  properties: {
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
    blackAndWhiteView: booleanRule({ yaml: "ЧерноБелыйПросмотр", implicitValueYAML: false }),
    borderColor: colorRule({
      yaml: "ЦветРамки",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    commandSet: commandSetRule({ yaml: "Команда", toEnterprise: false }),
    drawingSelectionShowMode: systemEnumerationRule({
      yaml: "РежимОтображенияВыделенияРисунков",
      typeSE: "DrawingSelectionShowMode",
      implicitValueYAML: "Auto",
    }),
    edit: booleanRule({ yaml: "Редактирование", implicitValueYAML: false }),
    enableDrag: booleanRule({ yaml: "РазрешитьПеретаскивание", implicitValueYAML: true }),
    enableStartDrag: booleanRule({ yaml: "РазрешитьНачалоПеретаскивания", implicitValueYAML: true }),
    height: numberRule({ yaml: "Высота", implicitValueYAML: 10 }),
    horizontalScrollBar: scrollBarUseBooleanRule({
      yaml: "ГоризонтальнаяПолосаПрокрутки",
      implicitValueYAML: "AutoUse",
    }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", implicitValueYAML: true }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    output: systemEnumerationRule({
      yaml: "Вывод",
      typeSE: "UseOutput",
      implicitValueYAML: "Auto",
    }),
    pointerType: systemEnumerationRule({
      yaml: "ТипКурсоров",
      typeSE: "SpreadsheetDocumentPointerType",
      implicitValueYAML: "Special",
    }),
    protection: booleanRule({ yaml: "Защита", implicitValueYAML: false }),
    selectionShowMode: systemEnumerationRule({
      yaml: "РежимОтображенияВыделения",
      typeSE: "SelectionShowMode",
      implicitValueYAML: "Always",
    }),
    showCellNames: booleanRule({ yaml: "ОтображатьИменаЯчеек", implicitValueYAML: false }),
    showGrid: booleanRule({ yaml: "ОтображатьСетку", implicitValueYAML: false }),
    showGroups: booleanRule({ yaml: "ОтображатьГруппировки", implicitValueYAML: true }),
    showHeaders: booleanRule({ yaml: "ОтображатьЗаголовки", implicitValueYAML: false }),
    showRowAndColumnNames: booleanRule({ yaml: "ОтображатьИменаСтрокИКолонок", implicitValueYAML: false }),
    statePresentation: systemEnumerationRule({
      yaml: "ОтображениеСостояния",
      typeSE: "StatePresentation",
      runtimeOnly: true,
    }),
    usedFileName: stringRule({
      yaml: "ИспользуемоеИмяФайла",
      runtimeOnly: true,
    }),
    verticalScrollBar: scrollBarUseBooleanRule({
      yaml: "ВертикальнаяПолосаПрокрутки",
      implicitValueYAML: "AutoUse",
    }),
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", implicitValueYAML: true }),
    viewScalingMode: systemEnumerationRule({
      yaml: "РежимМасштабированияПросмотра",
      typeSE: "ViewScalingMode",
      implicitValueYAML: "Auto",
    }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 50 }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        selection: "Выбор",
        dragStart: "НачалоПеретаскивания",
        additionalDetailProcessing: "ОбработкаДополнительнойРасшифровки",
        uRLProcessing: "ОбработкаНавигационнойСсылки",
        detailProcessing: "ОбработкаРасшифровки",
        dragEnd: "ОкончаниеПеретаскивания",
        beforeWrite: "ПередЗаписью",
        beforePrint: "ПередПечатью",
        drag: "Перетаскивание",
        afterWrite: "ПослеЗаписи",
        onActivate: "ПриАктивизации",
        onChangeAreaContent: "ПриИзмененииСодержимогоОбласти",
        dragCheck: "ПроверкаПеретаскивания",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      toYAML: false,
      fromYAML: false,
      defaultType: "SpreadsheetDocument",
    }),
    ...formFieldCommonProperties,
    ...formFieldDisabledTableRelatedProperties,
    titleHeight: numberRule({ yaml: "ВысотаЗаголовка", implicitValueYAML: 0 }),
  },
} as const satisfies ElementRule
registerElementRule("SpreadSheetDocumentField", SpreadSheetDocumentFieldRules)
