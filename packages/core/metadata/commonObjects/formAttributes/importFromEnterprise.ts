import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import {
  FormAttribute,
  FormAttributeEnterprise,
  FormAttributes,
  FormAttributesEnterprise,
} from "~/metadata/commonObjects/formAttributes/types"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise"
import { getDefaultsFormAttribute } from "./defaults"

export const importFormAttributesFromEnterprise = (
  context: ConfigurationContext,
  data: FormAttributesEnterprise | undefined
): FormAttributes | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importFormAttributeFromEnterprise(context, value, name))
    .filter((item): item is FormAttribute => item !== undefined)
}

const importFormAttributeFromEnterprise = (
  context: ConfigurationContext,
  data: FormAttributeEnterprise | string | string[],
  name: string
): FormAttribute | undefined => {
  if (typeof data === "string" || Array.isArray(data)) {
    const type = importTypeDescriptionFromEnterprise(context, data)
    if (!type) throw new Error("Type is required")

    return {
      name,
      id: generateId(name),
      valueType: type,
    }
  }

  const type = importTypeDescriptionFromEnterprise(context, data.Тип)

  const title = addDefaultLanguageNameToSynonym(context, importI8nTextFromEnterprise(context, data.Заголовок), name)

  const result: FormAttribute = {
    name,
    id: generateId(name),
  }

  if (type !== undefined) result.valueType = type

  if (title !== undefined) result.title = title

  const mainAttribute = importBooleanFromEnterprise(context, data.ОсновнойРеквизит)
  if (mainAttribute !== undefined) result.mainAttribute = mainAttribute

  const storedData = importBooleanFromEnterprise(context, data.СохраняемыеДанные)
  if (storedData !== undefined) result.storedData = storedData

  const use = importUserVisibleFromEnterprise(
    context,
    data[UserVisibleKeysEnterprise.Allow] || data[UserVisibleKeysEnterprise.Deny],
    data[UserVisibleKeysEnterprise.Allow]
      ? UserVisibleKeysEnterprise.Allow
      : data[UserVisibleKeysEnterprise.Deny]
        ? UserVisibleKeysEnterprise.Deny
        : undefined
  )
  if (use !== undefined) result.use = use

  const defaults = getDefaultsFormAttribute(context, result)
  return removeDefaults(result, defaults)
}

const generateId = (name: string): string => {
  // Простая генерация ID на основе имени
  // В реальном приложении может быть более сложная логика
  return name.toLowerCase().replace(/[^a-z0-9]/g, "")
}
