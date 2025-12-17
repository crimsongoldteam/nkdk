import { capitalCase, noCase } from "change-case"
import { stringify } from "yaml"
import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/lib/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { FormAttribute } from "../types"

export default function formatFormAttributes(
  attributes: FormAttribute[],
  configurationSettings: ConfigurationSettings
): string[] {
  const result: string[] = []

  for (const attribute of attributes) {
    const title = exportI8nTextToEnterprise(attribute.title, configurationSettings)
    const titleText = typeof title === "string" ? title : title?.ru
    const isTitleEqualToName = Boolean(titleText && isTitleEqualCamelCaseName(titleText, attribute.name))

    const data = transformAttribute(attribute, configurationSettings, isTitleEqualToName)
    const keys = Object.keys(data)

    // Компактный формат: только тип, без title, mainAttribute, storedData
    if (
      keys.length === 1 &&
      keys[0] === "Тип" &&
      "Тип" in data &&
      !title &&
      !attribute.mainAttribute &&
      !attribute.storedData
    ) {
      result.push(`${attribute.name}: ${data.Тип}`)
    }
    // Короткий формат: title равен camelCase имени, только тип - используем имя атрибута
    else if (isTitleEqualToName && keys.length === 1 && keys[0] === "Тип" && "Тип" in data) {
      result.push(`${attribute.name}: ${data.Тип}`)
    }
    // Формат с именем: title равен camelCase имени, но есть дополнительные поля - используем имя атрибута
    else if (isTitleEqualToName) {
      const yamlString = stringify(
        { [attribute.name]: data },
        {
          indent: 2,
          lineWidth: 0,
        }
      ).trim()
      // Добавляем пробел после двоеточия для соответствия ожидаемому формату
      const formattedString = yamlString.replace(/^([^:]+):/, "$1: ")
      result.push(formattedString)
    }
    // Полный формат: используем имя атрибута
    else {
      const yamlString = stringify(
        { [attribute.name]: data },
        {
          indent: 2,
          lineWidth: 0,
        }
      ).trim()
      result.push(yamlString)
    }
  }

  return result
}

const isTitleEqualCamelCaseName = (title: string, name: string): boolean => {
  // Убираем специальные символы из title (например, звездочку)
  const normalizedTitle = title.trim()

  // Преобразуем имя из camelCase в обычный текст
  const nameAsText = capitalCase(noCase(name))

  // Сравниваем без учета регистра
  return normalizedTitle.toLowerCase() === nameAsText.toLowerCase()
}

const transformAttribute = (
  attribute: FormAttribute,
  configurationSettings: ConfigurationSettings,
  skipTitle: boolean = false
): Record<string, any> => {
  const title = exportI8nTextToEnterprise(attribute.title, configurationSettings)
  const type = exportTypeDescriptionToEnterprise(attribute.type, configurationSettings)
  const mainAttribute = exportBooleanToEnterprise(attribute.mainAttribute, configurationSettings)
  const storedData = exportBooleanToEnterprise(attribute.storedData, configurationSettings)
  let attributeData: Record<string, any> = {}

  // Не добавляем Заголовок, если title равен camelCase имени (будет использован в качестве имени)
  if (title && !skipTitle) {
    attributeData.Заголовок = title
  }
  if (type) {
    attributeData.Тип = type
  }

  if (mainAttribute !== undefined) {
    attributeData.ОсновнойАтрибут = mainAttribute
  }

  if (storedData !== undefined) {
    attributeData.СохраняемыеДанные = storedData
  }

  if (attribute.use) {
    attributeData.push(exportUserVisibleToEnterprise(attribute.use, configurationSettings))
  }

  return attributeData
}
