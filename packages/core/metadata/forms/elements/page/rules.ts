import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { formGroupCommonProperties } from "../formGroup/rules"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
export type { ElementRule, PropertyRule }

export const PageRules = {
  itemType: "Page",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.Page",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    backColor: { yaml: "ЦветФона", type: "Color" },
    childItems: {
      yaml: "Элементы",
      type: "GroupChildItems",
      defaultValue: [],
    },
    childItemsHorizontalAlign: {
      yaml: "ГоризонтальноеПоложениеПодчиненных",
      xml: "HorizontalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    childItemsVerticalAlign: {
      yaml: "ВертикальноеПоложениеПодчиненных",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    format: { yaml: "Формат", type: "I8nText" },
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsGroup",
    },
    horizontalSpacing: {
      yaml: "ГоризонтальныйИнтервал",
      type: "SystemEnumeration",
      typeSE: "FormItemSpacing",
    },
    itemsAndTitlesAlign: {
      yaml: "ВыравниваниеЭлементовИЗаголовков",
      xml: "ChildrenAlign",
      type: "SystemEnumeration",
      typeSE: "ItemsAndTitlesAlignVariant",
    },
    picture: { yaml: "Картинка", type: "Picture" },
    scrollOnCompress: { yaml: "СкроллПриСжатии", type: "boolean" },
    showTitle: { yaml: "ОтображатьЗаголовок", type: "boolean" },
    slaveItemsWidth: {
      yaml: "ШиринаПодчиненныхЭлементов",
      xml: "ChildItemsWidth",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsWidth",
    },
    titleDataPath: { yaml: "ПутьКДаннымЗаголовка", type: "DataPath", defaultType: "string" },
    verticalAlign: {
      yaml: "ВертикальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    verticalScrollOnReduceSize: { yaml: "ВертикальнаяПрокруткаПриСжатии", type: "boolean" },
    verticalSpacing: {
      yaml: "ВертикальныйИнтервал",
      type: "SystemEnumeration",
      typeSE: "FormItemSpacing",
    },
    ...formGroupCommonProperties,
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormGroupType",
      runtimeOnly: true,
    },
  },
} as const satisfies ElementRule

registerElementRule("Page", PageRules)
