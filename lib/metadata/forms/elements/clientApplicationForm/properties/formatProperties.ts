import { TBaseElement } from "../../baseElement/types"
import { formatElementProperties } from "~/lib/format/format"

export const formatProperties = (elements: TBaseElement[]): object => {
  const result: Record<string, object> = {}

  for (const element of elements) {
    const formattedProperties = formatElementProperties(
      element.elementType,
      element
    )

    if (!formattedProperties) continue

    result[element.name] = formattedProperties
  }

  return result
}
