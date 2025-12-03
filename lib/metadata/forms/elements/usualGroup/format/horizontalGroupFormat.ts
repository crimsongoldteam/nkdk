import { formatElement } from "~/lib/format/formatFactory"
import { formatElementName } from "~/lib/format/helpers"
import { IFormatElementResult } from "~/lib/format/types"
import { addSimpleIndent } from "~/lib/format/wrap/addIndents"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import * as t from "~/lib/parser/lexer"
import { TUsualGroup } from "../types"

const FIRST_LINE_SEPARATOR = " " + (t.Hash.LABEL as string)
const SEPARATOR = " " + "|"

export const formatHorizontalGroup = (
  element: TUsualGroup,
  configurationSettings: TConfigurationSettings
): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: ["%" + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  let verticalGroups: string[][] = getVerticalItems(
    element,
    configurationSettings
  )
  // let rows = mergeHorizontally(FIRST_LINE_SEPARATOR, SEPARATOR, ...verticalGroups)

  // let haveSimpleHorizontalGroup = false

  // for (const group of verticalGroups) {
  //   // result.strings.push(...group)
  //   haveSimpleHorizontalGroup =
  //     haveSimpleHorizontalGroup || group.some((item) => item.includes("|"))
  // }

  // result.haveSimpleHorizontalGroup = haveSimpleHorizontalGroup

  // if (haveSimpleHorizontalGroup) {
  result.strings.push(...verticalGroups.flat())
  return result
}

const getVerticalItems = (
  element: TUsualGroup,
  configurationSettings: TConfigurationSettings
): string[][] => {
  let result: string[][] = []
  let isFirst = true
  for (const item of element.childItems) {
    const formattedItem = formatElement(item, configurationSettings)
    result.push(addSimpleIndent(formattedItem.strings))
    isFirst = false
  }
  return result
}

const mergeHorizontally = (
  firstLineSeparator: string,
  separator: string,
  ...arrays: string[][]
): string[] => {
  const maxLength = Math.max(...arrays.map((arr) => arr.length))

  const arrayWidths = arrays.map((arr) => (arr.length > 0 ? arr[0].length : 0))

  const result: string[] = []

  for (let rowIndex = 0; rowIndex < maxLength; rowIndex++) {
    let mergedRow = ""
    const currentSeparator = rowIndex == 0 ? firstLineSeparator : separator

    for (let colIndex = 0; colIndex < arrays.length; colIndex++) {
      if (colIndex > 0) {
        mergedRow += currentSeparator
      }

      const cell =
        rowIndex < arrays[colIndex].length
          ? arrays[colIndex][rowIndex]
          : " ".repeat(arrayWidths[colIndex])

      mergedRow += cell
    }

    result.push(mergedRow)
  }

  return result
}
