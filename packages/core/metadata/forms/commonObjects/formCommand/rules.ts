import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const FormCommandRules = {
  itemType: "FormCommand",
  properties: {
    id: {
      xml: "_id",
      type: "ElementId",
      forReferenceOnly: true,
    },
    name: {
      type: "string",
      xml: "_name",
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
      yaml: "Использование",
      type: "UserVisible",
    },
    shortcut: {
      yaml: "СочетаниеКлавиш",
      xml: "Shortcut",
      type: "string",
    },
    picture: {
      yaml: "Картинка",
      type: "Picture", metadataTarget: { kind: "object", roots: ["CommonPicture"] },
    },
    action: {
      yaml: "Действие",
      xml: "Action",
      type: "string",
    },
    functionalOptions: {
      yaml: "ФункциональныеОпции",
      type: "FunctionalOptionsProperty",
    },
    representation: {
      yaml: "ОтображениеКнопки",
      xml: "Representation",
      type: "SystemEnumeration",
      typeSE: "ButtonRepresentation",
      implicitValueYAML: "Auto",
    },
    currentRowUse: {
      yaml: "ИспользованиеТекущейСтроки",
      xml: "CurrentRowUse",
      type: "SystemEnumeration",
      typeSE: "CurrentRowUse",
      implicitValueYAML: "Auto",
    },
    modifiesSavedData: {
      yaml: "ИзменяемыеДанные",
      xml: "ModifiesSavedData",
      type: "boolean",
      implicitValueYAML: false,
    },
    table: {
      yaml: "Таблица",
      xml: "AssociatedTableElementId",
      type: "AssociatedTable",
      toEnterprise: false,
    },
  },
} as const satisfies MetadataItemRule
