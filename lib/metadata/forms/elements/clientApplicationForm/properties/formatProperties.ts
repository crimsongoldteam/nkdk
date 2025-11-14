import { TBaseElement } from "../../baseElement/types"
import { formatElementProperties } from "~/lib/format/format"
import * as yaml from "js-yaml"

export const formatProperties = (elements: TBaseElement[]): string[] => {
  const result: string[] = []

  for (const element of elements) {
    const formattedProperties = formatElementProperties(
      element.elementType,
      element
    )

    if (!formattedProperties) continue

    const yamlString = yaml
      .dump(
        { [element.name]: formattedProperties },
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

  const sortedResult = result.sort((a, b) => a.localeCompare(b))

  return sortedResult
}
