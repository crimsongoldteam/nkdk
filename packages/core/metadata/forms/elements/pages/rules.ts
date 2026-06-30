import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formGroupCommonProperties } from "../formGroup/rules"
export type { ElementRule, PropertyRule }
export const PagesRules = {
  itemType: "Pages",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.Pages",
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    childItems: {
      yaml: "Элементы",
      type: "PagesChildItems",
      defaultValue: [],
    },
    displayImportance: systemEnumerationRule({
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    }),
    currentPagesState: systemEnumerationRule({
      yaml: "ТекущееСостояниеСтраниц",
      typeSE: "FormPagesState",
      implicitValueYAML: "CurrentPage",
      runtimeOnly: true,
    }),
    currentRowUse: systemEnumerationRule({
      yaml: "ИспользованиеТекущейСтроки",
      typeSE: "CurrentRowUse",
      implicitValueYAML: "Auto",
    }),
    pagesRepresentation: systemEnumerationRule({
      yaml: "ОтображениеСтраниц",
      typeSE: "FormPagesRepresentation",
      implicitValueYAML: "Auto",
    }),
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        onCurrentPageChange: "ПриСменеСтраницы",
      },
    },
    table: {
      yaml: "Таблица",
      xml: "AssociatedTableElementId",
      type: "AssociatedTable",
      toEnterprise: false,
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
    type: systemEnumerationRule({
      yaml: "Вид",
      typeSE: "FormGroupType",
      runtimeOnly: true,
      implicitValueYAML: "Pages",
    }),
  },
} as const satisfies ElementRule
registerElementRule("Pages", PagesRules)
