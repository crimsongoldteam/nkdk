import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
export type { ElementRule, PropertyRule }

export const PagesRules = {
  itemType: "Pages",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.Pages",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    childItems: {
      type: "PagesChildItems",
      defaultValue: [],
      toPartialYAML: false,
      fromPartialYAML: true,
      required: true,
    },
    currentPagesState: {
      yaml: "ТекущееСостояниеСтраниц",
      type: "SystemEnumeration",
      typeSE: "FormPagesState",
    },
    currentRowUse: {
      yaml: "ИспользованиеТекущейСтроки",
      type: "SystemEnumeration",
      typeSE: "CurrentRowUse",
    },
    enableContentChange: { yaml: "РазрешитьИзменениеСостава", type: "boolean" },
    enabled: { yaml: "Доступность", type: "boolean" },
    extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip", toEnterprise: false },
    height: { yaml: "Высота", type: "number" },
    horizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложениеВГруппе",
      xml: "GroupHorizontalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    pagesRepresentation: {
      yaml: "ОтображениеСтраниц",
      type: "SystemEnumeration",
      typeSE: "FormPagesRepresentation",
    },
    readOnly: { yaml: "ТолькоПросмотр", type: "boolean" },
    shortcut: { yaml: "СочетаниеКлавиш", type: "string", toEnterprise: false },
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      yamlPartialOthers: true,
    },
    titleFont: { yaml: "ШрифтЗаголовка", type: "Font" },
    titleTextColor: { yaml: "ЦветТекстаЗаголовка", type: "Color" },
    toolTip: { yaml: "Подсказка", type: "I8nText" },
    toolTipRepresentation: {
      yaml: "ОтображениеПодсказки",
      type: "SystemEnumeration",
      typeSE: "ToolTipRepresentation",
    },
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormGroupType",
    },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
      toEnterprise: false,
    },
    verticalAlignInGroup: {
      yaml: "ВертикальноеПоложениеВГруппе",
      xml: "GroupVerticalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    visible: { yaml: "Видимость", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        onCurrentPageChange: "ПриСменеСтраницы",
      },
    },
  },
} as const satisfies ElementRule

registerElementRule("Pages", PagesRules)
