import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { ElementRule, registerElementRule } from "../../metadataFactory/elementRulesFactory"
import { FormAttribute } from "./types"
export type { ElementRule, PropertyRule }

export const FormAttributeRules: ElementRule<FormAttribute> = {
  properties: {
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      yamlPartialOthers: true,
    },
    valueType: {
      yaml: "Тип",
      type: "TypeDescription",
    },
    mainAttribute: {
      yaml: "ОсновнойРеквизит",
      xml: "MainAttribute",
      type: "boolean",
    },
    storedData: {
      yaml: "СохраняемыеДанные",
      xml: "SavedData",
      type: "boolean",
    },
    view: {
      yaml: "РазрешитьПросмотр",
      yamlDeny: "ЗапретитьПросмотр",
      type: "UserVisible",
    },
    edit: {
      yaml: "РазрешитьРедактирование",
      yamlDeny: "ЗапретитьРедактирование",
      type: "UserVisible",
    },
    fillCheck: {
      yaml: "ПроверкаЗаполнения",
      type: "FillChecking",
    },
    settings: {
      yaml: "Настройки",
      type: "TypeDescription",
    },
    columns: {
      yaml: "Колонки",
      type: "FormAttributeColumn",
    },
    additionalColumns: {
      yaml: "ДополнительныеКолонки",
      type: "FormAttributeAdditionalColumn",
    },
    functionalOptions: {
      yaml: "ФункциональныеОпции",
      type: "FunctionalOptions",
    },
    fieldsList: {
      yaml: "ИспользоватьВсегда",
      type: "FieldsList",
    },
    save: {
      yaml: "Сохранение",
      type: "FieldsList",
    },
  },
}

registerElementRule("FormAttribute", FormAttributeRules)
