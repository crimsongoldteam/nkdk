import * as yaml from "js-yaml"
import { formatI8nText } from "~/lib/formatter/formatI8nText"
import { formatTypeDescription } from "~/lib/metadata/typeDescription/formatTypeDescription"
import { TAttribute, TAttributesEnterpriseXML } from "../types"

export default function formatFormAttributes(attributes: TAttribute[]): string[] {
  const transformedAttributes = transformAttributes(attributes)

  const yamlString = yaml
    .dump(transformedAttributes, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    })
    .trim()

  return [yamlString]
}

const transformAttributes = (attributes: TAttribute[]): TAttributesEnterpriseXML => {
  return attributes.reduce(
    (acc, attribute) => ({
      ...acc,
      [attribute.name]: {
        Заголовок: formatI8nText(attribute.title),
        Тип: formatTypeDescription(attribute.type),
        ОсновнойАтрибут: formatBool(attribute.mainAttribute),
        СохраняемыеДанные: formatBool(attribute.storedData),
      },
    }),
    {}
  )
}

const formatBool = (value: boolean | undefined): string | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}
