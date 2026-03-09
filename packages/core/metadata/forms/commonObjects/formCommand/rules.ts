import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const FormCommandRules = {
  itemType: "FormCommand",
  properties: {
    name: {
      type: "string",
      required: true,
    },
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      skipEmptyToXML: true,
      defaultValue: ({ context, name, operation }) => {
        if (operation === "importFromXML") {
          return { items: { [context.defaultLanguage]: "" } }
        }
        if (name === undefined) throw new Error("name is required for title default value")
        return {
          items: { [context.defaultLanguage]: splitPascalCase(name) },
        }
      },
      excludeIfEqualNameYAML: true,
    },
    toolTip: {
      yaml: "Подсказка",
      type: "I8nText",
    },
    use: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
    },
    shortcut: {
      yaml: "СочетаниеКлавиш",
      xml: "Shortcut",
      type: "string",
    },
    picture: {
      yaml: "Картинка",
      type: "Picture",
    },
    action: {
      yaml: "Действие",
      xml: "Action",
      type: "string",
    },
    representation: {
      yaml: "ОтображениеКнопки",
      xml: "Representation",
      type: "SystemEnumeration",
      typeSE: "ButtonRepresentation",
    },
    currentRowUse: {
      yaml: "ИспользованиеТекущейСтроки",
      xml: "CurrentRowUse",
      type: "SystemEnumeration",
      typeSE: "CurrentRowUse",
    },
    modifiesSavedData: {
      yaml: "ИзменяемыеДанные",
      xml: "ModifiesSavedData",
      type: "boolean",
    },
    table: {
      yaml: "Таблица",
      xml: "AssociatedTableElementId",
      type: "AssociatedTable",
      toEnterprise: false,
    },
  },
} as const satisfies MetadataItemRule
