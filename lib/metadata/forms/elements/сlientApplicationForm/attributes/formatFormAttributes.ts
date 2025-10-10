import * as yaml from "js-yaml"
import { formatTypeDescription } from "~/lib/metadata/typeDescription/formatTypeDescription"
import { TAttribute, TAttributesEnterpriseXML } from "../types"
import { formatI8nText } from "~/lib/metadata/i8nText/formatI8nText"

export default function formatFormAttributes(attributes: TAttribute[]): string[] {
  const transformedAttributes = transformAttributes(attributes)

  const result: string[] = []

  for (const [name, data] of Object.entries(transformedAttributes)) {
    const keys = Object.keys(data)

    if (keys.length === 1 && keys[0] === "Тип") {
      result.push(`${name}: ${data.Тип}`)
    } else {
      const yamlString = yaml
        .dump(
          { [name]: data },
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

const transformAttributes = (attributes: TAttribute[]): TAttributesEnterpriseXML => {
  return attributes.reduce((acc, attribute) => {
    const title = formatI8nText(attribute.title)
    const type = formatTypeDescription(attribute.type)
    const mainAttribute = formatBool(attribute.mainAttribute)
    const storedData = formatBool(attribute.storedData)

    const attributeData: any = {}

    if (title) {
      attributeData.Заголовок = title
    }
    attributeData.Тип = type
    if (mainAttribute !== undefined) {
      attributeData.ОсновнойАтрибут = mainAttribute
    }
    if (storedData !== undefined) {
      attributeData.СохраняемыеДанные = storedData
    }

    return {
      ...acc,
      [attribute.name]: attributeData,
    }
  }, {})
}

const formatBool = (value: boolean | undefined): string | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}
