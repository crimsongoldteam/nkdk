import { functionalOptionsPropertyRule } from "~/metadata/commonObjects/functionalOptionsProperty/types"
import { pictureRule } from "~/metadata/commonObjects/metadataTargets/types"
import { associatedTableRule } from "~/metadata/commonObjects/metadataValue/types"
import { userVisibleRule } from "~/metadata/commonObjects/userVisible/types"
import { elementIdRule } from "~/metadata/forms/commonObjects/elementId/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
export const FormCommandRules = {
  itemType: "FormCommand",
  properties: {
    id: elementIdRule({
      xml: "_id",
      forReferenceOnly: true,
    }),
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    title: i8nTextRule({
      yaml: "Заголовок",
      skipEmptyToXML: true,
      defaultValue: ({
        context,
        name,
        operation,
      }: {
        context: {
          defaultLanguage: string
        }
        name?: string
        operation: string
      }) => {
        if (operation === "importFromXML") {
          return { items: { [context.defaultLanguage]: "" } }
        }
        if (name === undefined) throw new Error("name is required for title default value")
        return {
          items: { [context.defaultLanguage]: splitPascalCase(name) },
        }
      },
      excludeIfEqualNameYAML: true,
    }),
    toolTip: i8nTextRule({
      yaml: "Подсказка",
    }),
    use: userVisibleRule({
      yaml: "Использование",
    }),
    shortcut: stringRule({
      yaml: "СочетаниеКлавиш",
      xml: "Shortcut",
    }),
    picture: pictureRule({
      yaml: "Картинка",
      metadataTarget: { kind: "object", roots: ["CommonPicture"] },
    }),
    action: stringRule({
      yaml: "Действие",
      xml: "Action",
    }),
    functionalOptions: functionalOptionsPropertyRule({
      yaml: "ФункциональныеОпции",
    }),
    representation: systemEnumerationRule({
      yaml: "ОтображениеКнопки",
      xml: "Representation",
      typeSE: "ButtonRepresentation",
      implicitValueYAML: "Auto",
    }),
    currentRowUse: systemEnumerationRule({
      yaml: "ИспользованиеТекущейСтроки",
      xml: "CurrentRowUse",
      typeSE: "CurrentRowUse",
      implicitValueYAML: "Auto",
    }),
    modifiesSavedData: booleanRule({
      yaml: "ИзменяемыеДанные",
      xml: "ModifiesSavedData",
      implicitValueYAML: false,
    }),
    table: associatedTableRule({
      yaml: "Таблица",
      xml: "AssociatedTableElementId",
      toEnterprise: false,
    }),
  },
} as const satisfies MetadataItemRule
