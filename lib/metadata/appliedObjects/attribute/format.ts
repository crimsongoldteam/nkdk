import { capitalCase, noCase } from "change-case"
import { stringify } from "yaml"
import { formatBoolean } from "~/lib/metadata/commonObjects/boolean/format"
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/format"
import { formatTypeDescription } from "~/lib/metadata/commonObjects/typeDescription/format"
import {
  formatUserVisible,
  getUserVisibleKey,
} from "~/lib/metadata/commonObjects/userVisible/format"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { TAttribute } from "../types"

export default function formatFormAttributes(
  attributes: TAttribute[],
  configurationSettings: TConfigurationSettings
): string[] {
  const result: string[] = []

  for (const attribute of attributes) {
    const title = formatI8nText(attribute.title, configurationSettings)
    const titleText = typeof title === "string" ? title : title?.ru
    const isTitleEqualToName = Boolean(
      titleText && isTitleEqualCamelCaseName(titleText, attribute.name)
    )

    const data = transformAttribute(
      attribute,
      configurationSettings,
      isTitleEqualToName
    )
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
    else if (
      isTitleEqualToName &&
      keys.length === 1 &&
      keys[0] === "Тип" &&
      "Тип" in data
    ) {
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
  attribute: TAttribute,
  configurationSettings: TConfigurationSettings,
  skipTitle: boolean = false
): Record<string, any> => {
  const title = formatI8nText(attribute.title, configurationSettings)
  const type = formatTypeDescription(attribute.type)
  const mainAttribute = formatBoolean(attribute.mainAttribute)
  const storedData = formatBoolean(attribute.storedData)
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
    const userVisibleKey = getUserVisibleKey(attribute.use)
    attributeData[userVisibleKey] = formatUserVisible(attribute.use)
  }

  return attributeData
}
