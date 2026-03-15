import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const ChartFieldRules = {
  itemType: "ChartField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.ChartField",
  properties: {
    ...formFieldCommonProperties,
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    height: { yaml: "Высота", type: "number" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
      toEnterprise: false,
    },
    readOnly: { yaml: "ТолькоПросмотр", type: "boolean", defaultValue: false },
    shortcut: { yaml: "СочетаниеКлавиш", type: "string", toEnterprise: false },
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        selection: "Выбор",
        detailProcessing: "ОбработкаРасшифровки",
        onActivate: "ПриАктивизации",
      },
    },
  },
} as const satisfies ElementRule

registerElementRule("ChartField", ChartFieldRules)
