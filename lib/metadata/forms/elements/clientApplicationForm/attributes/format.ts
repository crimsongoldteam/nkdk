import { TAttribute } from "../types"
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/formatI8nText"
import { formatTypeDescription } from "~/lib/metadata/commonObjects/typeDescription/format"
import { formatBool } from "~/lib/format/formatBool"
import { formatUse } from "~/lib/metadata/commonObjects/userVisible/format"
import * as yaml from "js-yaml"

export default function formatFormAttributes(
  attributes: TAttribute[]
): string[] {
  const result: string[] = []

  for (const attribute of attributes) {
    const data = transformAttribute(attribute)
    const keys = Object.keys(data)

    if (keys.length === 1 && keys[0] === "Тип" && "Тип" in data) {
      result.push(`${attribute.name}: ${data.Тип}`)
    } else {
      const yamlString = yaml
        .dump(
          { [attribute.name]: data },
          {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
          }
        )
        .trim()
      result.push(yamlString)
    }
  }

  return result
}

const transformAttribute = (attribute: TAttribute): Record<string, any> => {
  const title = formatI8nText(attribute.title)
  const type = formatTypeDescription(attribute.type)
  const mainAttribute = formatBool(attribute.mainAttribute)
  const storedData = formatBool(attribute.storedData)
  const use = formatUse(attribute.use)
  let attributeData: Record<string, any> = {}

  if (title) {
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

  if (use) {
    attributeData = { ...attributeData, ...use }
  }

  return attributeData
}
