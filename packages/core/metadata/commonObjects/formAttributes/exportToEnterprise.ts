import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { compactObject } from "../../helpers/compactObject"
import { I8nTextEnterprise } from "../i8nText/types"
import { FormAttribute, FormAttributeEnterprise, FormAttributes, FormAttributesEnterprise } from "./types"

export const exportFormAttributeToEnterprise = (
  context: ConfigurationContext,
  attribute: FormAttribute | undefined
): FormAttributeEnterprise | undefined => {
  if (!attribute) return undefined

  const title = exportI8nTextToEnterprise(context, attribute.title)

  if (isUseShortFormat(attribute, title)) {
    const type = exportTypeDescriptionToEnterprise(context, attribute.valueType)
    return {
      [attribute.name]: type,
    }
  }

  return transformAttribute(context, attribute)
}

export const exportFormAttributesToEnterprise = (
  context: ConfigurationContext,
  data: FormAttributes | undefined
): FormAttributesEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: FormAttribute) => [value.name, exportFormAttributeToEnterprise(context, value)!])
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

const transformAttribute = (context: ConfigurationContext, attribute: FormAttribute): FormAttributeEnterprise => {
  return compactObject<FormAttributeEnterprise>({
    Заголовок: exportI8nTextToEnterprise(context, attribute.title),
    Тип: exportTypeDescriptionToEnterprise(context, attribute.valueType),
    ОсновнойРеквизит: exportBooleanToEnterprise(context, attribute.mainAttribute),
    СохраняемыеДанные: exportBooleanToEnterprise(context, attribute.storedData),
    ...exportUserVisibleToEnterprise(context, attribute.use),
  })
}
