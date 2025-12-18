import { formatElements } from "~/lib/format/formatFactory"
import { IFormatElementResult } from "~/lib/format/types"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import exportFormAttributesToEnterprise from "./attributes/exportToEnterprise"
import { getAllElements } from "./getAllElements"
import { ClientApplicationForm } from "./types"

export const formatClientApplicationForm = (
  element: ClientApplicationForm,
  configurationSettings: ConfigurationSettings
): IFormatElementResult => {
  const childItems = element.childItems ?? []
  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  let header = element.title?.items.ru ?? ""

  if (header) {
    result.strings.push(...formatSectionHeader(header))
  }

  const allElements = getAllElements(element)

  const itemsResult = formatElements(childItems, configurationSettings)
  result.strings.push(...itemsResult.strings)
  result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || itemsResult.haveSimpleHorizontalGroup

  if (element.attributes) {
    result.strings.push(...formatSectionHeader("Реквизиты"))
    result.strings.push(...exportFormAttributesToEnterprise(element.attributes, configurationSettings))
  }

  if (allElements.length > 0) {
    result.strings.push(...formatSectionHeader("Свойства"))
    // result.strings.push(...formatProperties(allElements, configurationSettings))
  }

  return result
}

const formatSectionHeader = (header: string): string[] => {
  return [`--- ${header} ---`]
}
