import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/lib/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "../../helpers/compactObject"
import { I8nTextEnterprise } from "../i8nText/types"
import { FormAttribute, FormAttributeEnterprise, FormAttributes, FormAttributesEnterprise } from "./types"

export const exportFormAttributeToEnterprise = (
  configurationSettings: ConfigurationSettings,
  attribute: FormAttribute | undefined
): FormAttributeEnterprise | undefined => {
  if (!attribute) return undefined

  const title = exportI8nTextToEnterprise(configurationSettings, attribute.title)

  if (isUseShortFormat(attribute, title)) {
    const type = exportTypeDescriptionToEnterprise(configurationSettings, attribute.valueType)
    return {
      [attribute.name]: type,
    }
  }

  return transformAttribute(configurationSettings, attribute)
}

export const exportFormAttributesToEnterprise = (
  configurationSettings: ConfigurationSettings,
  data: FormAttributes | undefined
): FormAttributesEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: FormAttribute) => [value.name, exportFormAttributeToEnterprise(configurationSettings, value)!])
  )
}

const isUseShortFormat = (attribute: FormAttribute, title: I8nTextEnterprise | undefined): boolean => {
  //const name = attribute.name
  const isSimpleTitle = typeof title === "string"
  //&& isTitleEqualCamelCaseName(title, name)

  for (const key in attribute) {
    const value = attribute[key as keyof FormAttribute]
    if (value === undefined) continue

    if (key == "namex") continue

    if (key == "title" && isSimpleTitle) continue

    if (key == "valueType") continue

    return false
  }

  return false
}

// const isTitleEqualCamelCaseName = (title: string, name: string): boolean => {
//   // Убираем специальные символы из title (например, звездочку)
//   const normalizedTitle = title.trim()

//   // Преобразуем имя из camelCase в обычный текст
//   const nameAsText = capitalCase(noCase(name))

//   // Сравниваем без учета регистра
//   return normalizedTitle.toLowerCase() === nameAsText.toLowerCase()
// }

const transformAttribute = (
  configurationSettings: ConfigurationSettings,
  attribute: FormAttribute
): FormAttributeEnterprise => {
  return compactObject<FormAttributeEnterprise>({
    Заголовок: exportI8nTextToEnterprise(configurationSettings, attribute.title),
    Тип: exportTypeDescriptionToEnterprise(configurationSettings, attribute.valueType),
    ОсновнойРеквизит: exportBooleanToEnterprise(configurationSettings, attribute.mainAttribute),
    СохраняемыеДанные: exportBooleanToEnterprise(configurationSettings, attribute.storedData),
    ...exportUserVisibleToEnterprise(configurationSettings, attribute.use),
  })
}
