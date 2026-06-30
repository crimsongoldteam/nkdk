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
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    childItems: {
      yaml: "Элементы",
      type: "PagesChildItems",
      defaultValue: [],
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    },
    currentPagesState: {
      yaml: "ТекущееСостояниеСтраниц",
      type: "SystemEnumeration",
      typeSE: "FormPagesState",
      implicitValueYAML: "CurrentPage",
      runtimeOnly: true,
    },
    currentRowUse: {
      yaml: "ИспользованиеТекущейСтроки",
      type: "SystemEnumeration",
      typeSE: "CurrentRowUse",
      implicitValueYAML: "Auto",
    },
    pagesRepresentation: {
      yaml: "ОтображениеСтраниц",
      type: "SystemEnumeration",
      typeSE: "FormPagesRepresentation",
      implicitValueYAML: "Auto",
    },
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
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormGroupType",
      runtimeOnly: true,
      implicitValueYAML: "Pages",
    },
  },
} as const satisfies ElementRule

registerElementRule("Pages", PagesRules)
