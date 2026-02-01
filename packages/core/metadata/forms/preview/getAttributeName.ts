import { ConfigurationContext } from "~/metadata/context/types"
import { PreviewAttribute } from "../clientApplicationForm/base/types"

export const getAttributeName = (
  context: ConfigurationContext,
  dataPath?: string
): string | undefined => {
  if (!dataPath) return undefined

  const preview = context.preview!

  const nameWithoutDot = dataPath.replace(".", "")
  const title = dataPath.split(".").pop() ?? dataPath

  // Проверяем существующий атрибут по точному совпадению
  const existingAttribute = preview.attributes[dataPath] ?? preview.attributes[nameWithoutDot]

  // Формируем имя атрибута
  let name = preview.prefix + nameWithoutDot

  // Если имя уже используется, добавляем суффикс
  const existingNames = Object.values(preview.attributes).map((attr) => attr.name)
  let counter = 1
  while (existingNames.includes(name)) {
    name = preview.prefix + nameWithoutDot + counter
    counter++
  }

  const attribute: PreviewAttribute = {
    name: name,
    title: title,
    dataPath: name,
    type: { type: ["String"] },
  }

  preview.attributes[dataPath] = attribute

  // Если атрибут уже существовал (без точки), возвращаем часть после точки
  if (existingAttribute) {
    return title
  }

  return name
}
