import { formatElements } from "~/format/formatFactory"
import { IFormatElementResult } from "~/format/types"
import { exportFormAttributesToEnterprise } from "~/metadata/commonObjects/formAttributes/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { getAllElements } from "./getAllElements"
import { ClientApplicationForm } from "./types"

export const exportClientApplicationFormToEnterprise = (
  context: ConfigurationContext,
  element: ClientApplicationForm
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

  const itemsResult = formatElements(childItems, context)
  result.strings.push(...itemsResult.strings)
  result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || itemsResult.haveSimpleHorizontalGroup

  if (element.attributes) {
    result.strings.push(...formatSectionHeader("Реквизиты"))
    result.strings.push(...exportFormAttributesToEnterprise(context, element.attributes))
  }

  if (allElements.length > 0) {
    result.strings.push(...formatSectionHeader("Свойства"))
    // result.strings.push(...formatProperties(allElements, context))
  }

  return result
}

const formatSectionHeader = (header: string): string[] => {
  return [`--- ${header} ---`]
}
