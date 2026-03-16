import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const SpreadSheetDocumentFieldRules = {
  itemType: "SpreadSheetDocumentField",
  enterpriseFieldType: "FormFieldType.SpreadsheetDocumentField",
  enterpriseField: "FormField",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    blackAndWhiteView: { yaml: "ЧерноБелыйПросмотр", type: "boolean" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    drawingSelectionShowMode: {
      yaml: "РежимОтображенияВыделенияРисунков",
      type: "SystemEnumeration",
      typeSE: "DrawingSelectionShowMode",
    },
    edit: { yaml: "Редактирование", type: "boolean" },
    enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean" },
    enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean" },
    height: { yaml: "Высота", type: "number" },
    horizontalScrollBar: {
      yaml: "ГоризонтальнаяПолосаПрокрутки",
      type: "SystemEnumeration",
      typeSE: "ScrollBarUse",
    },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    output: {
      yaml: "Вывод",
      type: "SystemEnumeration",
      typeSE: "UseOutput",
    },
    pointerType: {
      yaml: "ТипКурсоров",
      type: "SystemEnumeration",
      typeSE: "SpreadsheetDocumentPointerType",
    },
    protection: { yaml: "Защита", type: "boolean" },
    selectionShowMode: {
      yaml: "РежимОтображенияВыделения",
      type: "SystemEnumeration",
      typeSE: "SelectionShowMode",
    },
    showCellNames: { yaml: "ОтображатьИменаЯчеек", type: "boolean" },
    showGrid: { yaml: "ОтображатьСетку", type: "boolean" },
    showGroups: { yaml: "ОтображатьГруппировки", type: "boolean" },
    showHeaders: { yaml: "ОтображатьЗаголовки", type: "boolean" },
    showRowAndColumnNames: { yaml: "ОтображатьИменаСтрокИКолонок", type: "boolean" },
    statePresentation: {
      yaml: "ОтображениеСостояния",
      type: "SystemEnumeration",
      typeSE: "StatePresentation",
    },
    usedFileName: { yaml: "ИспользуемоеИмяФайла", type: "string" },
    verticalScrollBar: {
      yaml: "ВертикальнаяПолосаПрокрутки",
      type: "SystemEnumeration",
      typeSE: "ScrollBarUse",
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    viewScalingMode: {
      yaml: "РежимМасштабированияПросмотра",
      type: "SystemEnumeration",
      typeSE: "ViewScalingMode",
    },
    width: { yaml: "Ширина", type: "number" },
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
        onChangeAreaContentEvent: "ПриИзмененииСодержимогоОбласти",
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
    ...formFieldTableRelatedProperties,
  },
} as const satisfies ElementRule

registerElementRule("SpreadSheetDocumentField", SpreadSheetDocumentFieldRules)
