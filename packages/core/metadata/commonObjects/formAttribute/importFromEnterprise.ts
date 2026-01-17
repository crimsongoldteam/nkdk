import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import {
  FormAttribute,
  FormAttributeEnterprise,
  FormAttributes,
  FormAttributesEnterprise,
} from "~/metadata/commonObjects/formAttribute/types"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"

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
    const type = importTypeDescriptionFromEnterprise(context, data)!

    return {
      name,
      valueType: type,
      title: { items: { [context.defaultLanguage]: splitPascalCase(name) } },
    }
  }

  const type = importTypeDescriptionFromEnterprise(context, data.Тип)

  const title = addDefaultLanguageNameToSynonym(context, importI8nTextFromEnterprise(context, data.Заголовок), name)

  const result: FormAttribute = {
    name,
    valueType: type!,
    title,
  }

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

  return result
}
