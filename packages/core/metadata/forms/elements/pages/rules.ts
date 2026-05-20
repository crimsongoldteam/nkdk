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
      required: true,
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
      defaultValueYAML: "Auto",
    },
    currentPagesState: {
      yaml: "ТекущееСостояниеСтраниц",
      type: "SystemEnumeration",
      typeSE: "FormPagesState",
      defaultValueYAML: "CurrentPage",
      runtimeOnly: true,
    },
    currentRowUse: {
      yaml: "ИспользованиеТекущейСтроки",
      type: "SystemEnumeration",
      typeSE: "CurrentRowUse",
      defaultValueYAML: "Auto",
    },
    pagesRepresentation: {
      yaml: "ОтображениеСтраниц",
      type: "SystemEnumeration",
      typeSE: "FormPagesRepresentation",
      defaultValueYAML: "Auto",
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
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormGroupType",
      runtimeOnly: true,
      defaultValueYAML: "Pages",
    },
  },
} as const satisfies ElementRule

registerElementRule("Pages", PagesRules)
