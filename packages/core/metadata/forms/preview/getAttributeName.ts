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

  return name
}
