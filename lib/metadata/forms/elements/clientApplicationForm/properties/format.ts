import * as yaml from "js-yaml"
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
