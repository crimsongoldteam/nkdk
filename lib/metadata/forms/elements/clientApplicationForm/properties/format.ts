import { stringify } from "yaml"
import { formatElementProperties } from "~/lib/format/format"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { TBaseElement } from "../../baseElement/types"

export const formatProperties = (
  elements: TBaseElement[],
  configurationSettings: TConfigurationSettings
): string[] => {
  const result: string[] = []

  for (const element of elements) {
    const formattedProperties = formatElementProperties(
      element.elementType,
      element,
      configurationSettings
    )

    if (!formattedProperties) continue

    const yamlString = stringify(
      { [element.name]: formattedProperties },
      {
        indent: 2,
        lineWidth: 0,
      }
    ).trim()
    result.push(yamlString)
  }

  const sortedResult = result.sort((a, b) => a.localeCompare(b))

  return sortedResult
}
