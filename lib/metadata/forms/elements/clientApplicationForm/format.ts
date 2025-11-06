import { formatElements } from "~/lib/format/formatFactory"
import { IFormatterParams, IFormatElementResult } from "~/lib/format/types"
import formatFormAttributes from "./attributes/format"
import { TClientApplicationForm } from "./types"

export function formatClientApplicationForm(
  element: TClientApplicationForm,
  _params: IFormatterParams
): IFormatElementResult {
  const result: IFormatElementResult = { strings: [], haveSimpleHorizontalGroup: false }

  let header = element.title?.items.ru ?? ""

  result.strings.push(...formatSectionHeader(header))

  // for (const item of element.items) {
  //   const itemFormatted = formatElement(item, _params)
  //   result.strings.push(...itemFormatted.strings)
  //   result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || itemFormatted.haveSimpleHorizontalGroup
  // }

  const itemsResult = formatElements(element.childItems)
  result.strings.push(...itemsResult.strings)
  result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || itemsResult.haveSimpleHorizontalGroup

  if (element.attributes) {
    result.strings.push(...formatSectionHeader("Реквизиты"))
    result.strings.push(...formatFormAttributes(element.attributes))
  }
  return result
}

const formatSectionHeader = (header: string | undefined): string[] => {
  if (!header) return []

  return ["======" + " [ " + header + " ] " + "======"]
}
