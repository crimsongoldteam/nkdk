import { TypeDescription } from "~/metadata/commonObjects/typeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importPropertiesFromYAML, registerTypeRule } from "~/metadata/metadataFactory"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import {
  FormAttribute,
  FormAttributeAdditionalColumn,
  FormAttributeColumn,
  FormAttributeColumnYAML,
  FormAttributeYAML,
  FormAttributes,
  FormAttributesEnterprise,
} from "./types"

export const importFormAttributesFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttributesEnterprise | undefined
): FormAttributes | undefined => {
  if (!data) return undefined

  return Object.entries(data).map(([name, value]) => importFormAttributeFromEnterprise(context, value, name))
}

const importFormAttributeFromEnterprise = (
  context: ConfigurationContext,
  data: FormAttributeYAML,
  name: string
): FormAttribute | TypeDescription => {
  const properties = importPropertiesFromYAML({
    context: context,
    yaml: data,
    metadataType: "FormAttribute",
    rules: FormAttributeRules,
  })

  const result: FormAttribute = {
    ...properties,
    name,
  }

  return result
}

const importFormAttributeColumnsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: Record<string, FormAttributeColumnYAML> | undefined
): FormAttributeColumn[] => {
  if (!data) return []

  return Object.entries(data)
    .map(([name, value]) => importFormAttributeColumnFromEnterprise(context, undefined, value, name))
    .filter((item): item is FormAttributeColumn => item !== undefined)
}

const importFormAttributeColumnFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormAttributeColumnYAML,
  name: string
): FormAttributeColumn => {
  const properties = importPropertiesFromYAML({
    context: context,
    yaml: data,
    metadataType: "FormAttributeColumn",
    rules: FormAttributeColumnRules,
  })

  const result: FormAttributeColumn = {
    ...properties,
    name,
  }

  return result
}

const importFormAttributeAdditionalColumnsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: Record<string, Record<string, FormAttributeColumnYAML>>
): FormAttributeAdditionalColumn[] => {
  return Object.entries(data).map(([tableName, columns]) => ({
    table: tableName,
    columns: importFormAttributeColumnsFromEnterprise(context, undefined, columns),
  }))
}

// /**
//  * Вычисляет заголовок для импорта из enterprise с учетом mainAttribute.
//  * Если mainAttribute = true:
//  * - Если заголовок отсутствует - устанавливаем пустой заголовок ("")
//  * - Если заголовок равен имени - сохраняем как есть
//  * Иначе - обычная логика (добавляем имя как заголовок по умолчанию)
//  */
// const computeTitleForImport = (
//   context: ConfigurationContext,
//   titleEnterprise: I8nTextEnterprise | undefined,
//   name: string,
//   mainAttribute: boolean | undefined
// ): I8nText => {
//   const defaultLanguage = context.defaultLanguage
//   const importedTitle = importI8nTextFromEnterprise(context, { type: "I8nText" }, titleEnterprise)

//   // Если mainAttribute = true
//   if (mainAttribute === true) {
//     // Если заголовок отсутствует - устанавливаем пустой заголовок
//     if (titleEnterprise === undefined) {
//       return { items: { [defaultLanguage]: "" } }
//     }
//     // Если заголовок равен имени - сохраняем как есть (без добавления значения по умолчанию)
//     if (isSynonymEqualToName(titleEnterprise, name)) {
//       return importedTitle ?? { items: { [defaultLanguage]: "" } }
//     }
//   }

//   // Обычная логика
//   return addDefaultLanguageNameToSynonym(context, importedTitle, name)
// }

registerTypeRule("FormAttributes", "importFromEnterprise", importFormAttributesFromEnterprise)
registerTypeRule("FormAttributeColumns", "importFromEnterprise", importFormAttributeColumnsFromEnterprise)
