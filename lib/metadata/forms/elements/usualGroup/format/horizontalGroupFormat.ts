import { TUsualGroup } from "../types"
import * as t from "~/lib/parser/lexer"
import { IFormatterParams, WrapInGroupStrategy } from "~/lib/format/types"
import { formatElement } from "~/lib/format/formatFactory"
import { formatElementName } from "~/lib/format/helpers"
import { formatGroupWrapping } from "~/lib/format/wrap/formatGroupWrapping"

const FIRST_LINE_SEPARATOR = " " + (t.Hash.LABEL as string)
const SEPARATOR = " " + "|"

export const formatHorizontalGroup = (element: TUsualGroup, params: IFormatterParams): string[] => {
  let result: string[] = [formatElementName(element)]

  let verticalGroups: string[][] = getVerticalItems(element)
  let rows = mergeHorizontally(FIRST_LINE_SEPARATOR, SEPARATOR, ...verticalGroups)
  result.push(...rows)

  const trimmedResult = result.map((line) => line.trim())

  return formatGroupWrapping(trimmedResult, params)
}

const getVerticalItems = (element: TUsualGroup): string[][] => {
  let result: string[][] = []
  let isFirst = true
  for (const item of element.childItems) {
    const formattedItem = formatElement(item, {
      isFirst: isFirst,
      level: 0,
      wrapInGroup: WrapInGroupStrategy.Always,
    })
    result.push(formattedItem)
    isFirst = false
  }
  return result
}

const mergeHorizontally = (firstLineSeparator: string, separator: string, ...arrays: string[][]): string[] => {
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

      const cell = rowIndex < arrays[colIndex].length ? arrays[colIndex][rowIndex] : " ".repeat(arrayWidths[colIndex])

      mergedRow += cell
    }

    result.push(mergedRow)
  }

  return result
}
