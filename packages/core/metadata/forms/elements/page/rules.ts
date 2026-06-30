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
    backColor: {
      yaml: "ЦветФона",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
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
      implicitValueYAML: "Auto",
    },
    childItemsVerticalAlign: {
      yaml: "ВертикальноеПоложениеПодчиненных",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
      implicitValueYAML: "Auto",
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    },
    format: { yaml: "Формат", type: "I8nText" },
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsGroup",
      implicitValueYAML: "Vertical",
    },
    horizontalSpacing: {
      yaml: "ГоризонтальныйИнтервал",
      type: "SystemEnumeration",
      typeSE: "FormItemSpacing",
      implicitValueYAML: "Auto",
    },
    itemsAndTitlesAlign: {
      yaml: "ВыравниваниеЭлементовИЗаголовков",
      xml: "ChildrenAlign",
      type: "SystemEnumeration",
      typeSE: "ItemsAndTitlesAlignVariant",
      implicitValueYAML: "Auto",
    },
    picture: { yaml: "Картинка", type: "Picture", metadataTarget: { kind: "object", roots: ["CommonPicture"] } },
    scrollOnCompress: { yaml: "СкроллПриСжатии", type: "boolean", noImplicitValueYAML: true },
    showTitle: { yaml: "ОтображатьЗаголовок", type: "boolean", implicitValueYAML: true },
    slaveItemsWidth: {
      yaml: "ШиринаПодчиненныхЭлементов",
      xml: "ChildItemsWidth",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsWidth",
      noImplicitValueYAML: true,
    },
    titleDataPath: { yaml: "ПутьКДаннымЗаголовка", type: "DataPath", defaultType: "string" },
    verticalAlign: {
      yaml: "ВертикальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
      noImplicitValueYAML: true,
    },
    verticalScrollOnReduceSize: {
      yaml: "ВертикальнаяПрокруткаПриСжатии",
      type: "boolean",
      implicitValueYAML: false,
    },
    verticalSpacing: {
      yaml: "ВертикальныйИнтервал",
      type: "SystemEnumeration",
      typeSE: "FormItemSpacing",
      implicitValueYAML: "Auto",
    },
    ...formGroupCommonProperties,
    height: {
      ...formGroupCommonProperties.height,
      implicitValueYAML: 0,
    },
    horizontalStretch: {
      ...formGroupCommonProperties.horizontalStretch,
      noImplicitValueYAML: true,
    },
    visible: {
      ...formGroupCommonProperties.visible,
      implicitValueYAML: true,
    },
    width: {
      ...formGroupCommonProperties.width,
      implicitValueYAML: 0,
    },
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormGroupType",
      runtimeOnly: true,
    },
  },
} as const satisfies ElementRule

registerElementRule("Page", PageRules)
