import { ConfigurationContext } from "~/metadata/context/types"
import { PreviewAttributeMapItem } from "../clientApplicationForm/base/types"

export const getAttributeName = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  dataPath?: string,
  tableDataPath?: string
): string | undefined => {
  if (!dataPath) return undefined

  const preview = context.preview!

  const nameWithoutDot = dataPath.replace(/\./g, "")
  const title = dataPath.split(".").pop() ?? dataPath

  // Формируем имя атрибута
  let name: string
  let attributeDataPath: string
  let existingTableAttribute: [string, PreviewAttributeMapItem] | undefined

  if (tableDataPath) {
    // Для табличных данных ищем существующий атрибут по tableDataPath
    const tableDataPathLower = tableDataPath.toLowerCase()
    existingTableAttribute = Object.entries(preview.attributes).find(
      ([key]) => key.toLowerCase() === tableDataPathLower
    )

    if (existingTableAttribute) {
      // Используем dataPath существующего атрибута таблицы
      name = title
      attributeDataPath = existingTableAttribute[1].parentPath + "." + name
    } else {
      // Для табличных данных имя атрибута - это только последняя часть dataPath
      name = title
      attributeDataPath = preview.prefix + tableDataPath + "." + name
    }
  } else {
    name = preview.prefix + nameWithoutDot
    attributeDataPath = name
  }

  // Если имя уже используется (case-insensitive), добавляем суффикс
  const existingNames = Object.values(preview.attributes).map((attr) => attr.name.toLowerCase())
  let counter = 1
  while (existingNames.includes(name.toLowerCase())) {
    if (tableDataPath) {
      name = title + counter
      attributeDataPath = preview.prefix + tableDataPath + "." + name
    } else {
      name = preview.prefix + nameWithoutDot + counter
      attributeDataPath = name
    }
    counter++
  }

  const attribute: PreviewAttributeMapItem = {
    name: name,
    title: title,
    type: { Type: ["string"] },
  }

  // Добавляем parentPath только для табличных данных
  if (tableDataPath) {
    attribute.parentPath = existingTableAttribute
      ? existingTableAttribute[1].parentPath
      : preview.prefix + tableDataPath
  }

  preview.attributes[dataPath.toLowerCase()] = attribute

  return attributeDataPath
}
