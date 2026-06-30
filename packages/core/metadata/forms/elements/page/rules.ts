import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
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
    name: stringRule({
      xml: "_name",
      required: true,
    }),
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
    childItemsHorizontalAlign: systemEnumerationRule({
      yaml: "ГоризонтальноеПоложениеПодчиненных",
      xml: "HorizontalAlign",
      typeSE: "ItemHorizontalLocation",
      implicitValueYAML: "Auto",
    }),
    childItemsVerticalAlign: systemEnumerationRule({
      yaml: "ВертикальноеПоложениеПодчиненных",
      typeSE: "ItemVerticalAlign",
      implicitValueYAML: "Auto",
    }),
    displayImportance: systemEnumerationRule({
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    }),
    format: i8nTextRule({ yaml: "Формат" }),
    group: systemEnumerationRule({
      yaml: "Группировка",
      typeSE: "ChildFormItemsGroup",
      implicitValueYAML: "Vertical",
    }),
    horizontalSpacing: systemEnumerationRule({
      yaml: "ГоризонтальныйИнтервал",
      typeSE: "FormItemSpacing",
      implicitValueYAML: "Auto",
    }),
    itemsAndTitlesAlign: systemEnumerationRule({
      yaml: "ВыравниваниеЭлементовИЗаголовков",
      xml: "ChildrenAlign",
      typeSE: "ItemsAndTitlesAlignVariant",
      implicitValueYAML: "Auto",
    }),
    picture: { yaml: "Картинка", type: "Picture", metadataTarget: { kind: "object", roots: ["CommonPicture"] } },
    scrollOnCompress: booleanRule({ yaml: "СкроллПриСжатии", noImplicitValueYAML: true }),
    showTitle: booleanRule({ yaml: "ОтображатьЗаголовок", implicitValueYAML: true }),
    slaveItemsWidth: systemEnumerationRule({
      yaml: "ШиринаПодчиненныхЭлементов",
      xml: "ChildItemsWidth",
      typeSE: "ChildFormItemsWidth",
      noImplicitValueYAML: true,
    }),
    titleDataPath: { yaml: "ПутьКДаннымЗаголовка", type: "DataPath", defaultType: "string" },
    verticalAlign: systemEnumerationRule({
      yaml: "ВертикальноеПоложение",
      typeSE: "ItemVerticalAlign",
      noImplicitValueYAML: true,
    }),
    verticalScrollOnReduceSize: booleanRule({
      yaml: "ВертикальнаяПрокруткаПриСжатии",
      implicitValueYAML: false,
    }),
    verticalSpacing: systemEnumerationRule({
      yaml: "ВертикальныйИнтервал",
      typeSE: "FormItemSpacing",
      implicitValueYAML: "Auto",
    }),
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
    type: systemEnumerationRule({
      yaml: "Вид",
      typeSE: "FormGroupType",
      runtimeOnly: true,
    }),
  },
} as const satisfies ElementRule
registerElementRule("Page", PageRules)
