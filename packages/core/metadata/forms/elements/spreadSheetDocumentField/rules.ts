import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const SpreadSheetDocumentFieldRules = {
  itemType: "SpreadSheetDocumentField",
  enterpriseFieldType: "FormFieldType.SpreadsheetDocumentField",
  enterpriseField: "FormField",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean", implicitValueYAML: true },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean", implicitValueYAML: true },
    blackAndWhiteView: { yaml: "ЧерноБелыйПросмотр", type: "boolean", implicitValueYAML: false },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    commandSet: { yaml: "Команда", type: "CommandSet", toEnterprise: false },
    drawingSelectionShowMode: {
      yaml: "РежимОтображенияВыделенияРисунков",
      type: "SystemEnumeration",
      typeSE: "DrawingSelectionShowMode",
      implicitValueYAML: "Auto",
    },
    edit: { yaml: "Редактирование", type: "boolean", implicitValueYAML: false },
    enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean", implicitValueYAML: true },
    enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean", implicitValueYAML: true },
    height: { yaml: "Высота", type: "number", implicitValueYAML: 10 },
    horizontalScrollBar: {
      yaml: "ГоризонтальнаяПолосаПрокрутки",
      type: "ScrollBarUseBoolean",
      implicitValueYAML: "AutoUse",
    },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", implicitValueYAML: true },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number", implicitValueYAML: 0 },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number", implicitValueYAML: 0 },
    output: {
      yaml: "Вывод",
      type: "SystemEnumeration",
      typeSE: "UseOutput",
      implicitValueYAML: "Auto",
    },
    pointerType: {
      yaml: "ТипКурсоров",
      type: "SystemEnumeration",
      typeSE: "SpreadsheetDocumentPointerType",
      implicitValueYAML: "Special",
    },
    protection: { yaml: "Защита", type: "boolean", implicitValueYAML: false },
    selectionShowMode: {
      yaml: "РежимОтображенияВыделения",
      type: "SystemEnumeration",
      typeSE: "SelectionShowMode",
      implicitValueYAML: "Always",
    },
    showCellNames: { yaml: "ОтображатьИменаЯчеек", type: "boolean", implicitValueYAML: false },
    showGrid: { yaml: "ОтображатьСетку", type: "boolean", implicitValueYAML: false },
    showGroups: { yaml: "ОтображатьГруппировки", type: "boolean", implicitValueYAML: true },
    showHeaders: { yaml: "ОтображатьЗаголовки", type: "boolean", implicitValueYAML: false },
    showRowAndColumnNames: { yaml: "ОтображатьИменаСтрокИКолонок", type: "boolean", implicitValueYAML: false },
    statePresentation: {
      yaml: "ОтображениеСостояния",
      type: "SystemEnumeration",
      typeSE: "StatePresentation",
      runtimeOnly: true,
    },
    usedFileName: {
      yaml: "ИспользуемоеИмяФайла",
      type: "string",
      runtimeOnly: true,
    },
    verticalScrollBar: {
      yaml: "ВертикальнаяПолосаПрокрутки",
      type: "ScrollBarUseBoolean",
      implicitValueYAML: "AutoUse",
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean", implicitValueYAML: true },
    viewScalingMode: {
      yaml: "РежимМасштабированияПросмотра",
      type: "SystemEnumeration",
      typeSE: "ViewScalingMode",
      implicitValueYAML: "Auto",
    },
    width: { yaml: "Ширина", type: "number", implicitValueYAML: 50 },
    events: {
      type: "Events",
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
    },
    dataPath: {
      yaml: "ПутьКДанным",
      type: "DataPath",
      toYAML: false,
      fromYAML: false,
      defaultType: "SpreadsheetDocument",
    },
    ...formFieldCommonProperties,
    ...formFieldDisabledTableRelatedProperties,
    titleHeight: { yaml: "ВысотаЗаголовка", type: "number", implicitValueYAML: 0 },
  },
} as const satisfies ElementRule

registerElementRule("SpreadSheetDocumentField", SpreadSheetDocumentFieldRules)
