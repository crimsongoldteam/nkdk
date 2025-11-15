import { formatElements } from "~/lib/format/formatFactory"
import { IFormatterParams, IFormatElementResult } from "~/lib/format/types"
import formatFormAttributes from "./attributes/format"
import { TClientApplicationForm } from "./types"
import { getAllElements } from "./getAllElements"
import { formatProperties } from "./properties/formatProperties"

export function formatClientApplicationForm(
  element: TClientApplicationForm,
  _params: IFormatterParams
): IFormatElementResult {
  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  let header = element.title?.items.ru ?? ""

  result.strings.push(...formatSectionHeader(header))

  const allElements = getAllElements(element)

  const itemsResult = formatElements(element.childItems)
  result.strings.push(...itemsResult.strings)
  result.haveSimpleHorizontalGroup =
    result.haveSimpleHorizontalGroup || itemsResult.haveSimpleHorizontalGroup

  if (element.attributes) {
    result.strings.push(...formatSectionHeader("Реквизиты"))
    result.strings.push(...formatFormAttributes(element.attributes))
  }

  result.strings.push(...formatSectionHeader("Свойства"))
  result.strings.push(...formatProperties(allElements))

  return result
}

const formatSectionHeader = (header: string | undefined): string[] => {
  if (!header) return []

  return ["======" + " [ " + header + " ] " + "======"]
}
