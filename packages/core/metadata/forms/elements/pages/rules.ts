import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { formGroupCommonProperties } from "../formGroup/rules"
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
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
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
    pagesRepresentation: {
      yaml: "ОтображениеСтраниц",
      type: "SystemEnumeration",
      typeSE: "FormPagesRepresentation",
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
    },
  },
} as const satisfies ElementRule

registerElementRule("Pages", PagesRules)
