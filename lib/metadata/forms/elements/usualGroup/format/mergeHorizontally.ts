import * as t from "~/lib/parser/lexer"
const WRAP_THRESHOLD_MULTIPLIER = 2
const FIRST_LINE_SEPARATOR = " " + (t.Hash.LABEL as string)
const SEPARATOR = " " + "+"

export const mergeHorizontally = (...arrays: string[][]): string[] => {
  const isNeedWrapArray = isNeedWrap(arrays)

  const result: string[] = []
  for (let colIndex = 0; colIndex < arrays.length; colIndex++) {
    const column = arrays[colIndex]
    const firstColumnLength = column[0].length
    if (isNeedWrapArray[colIndex]) {
      const rows = result.length

      const emptyCell = " ".repeat(firstColumnLength)

      result.push("-".repeat(firstColumnLength))
      for (const cell of column) {
        result.push(normalizeCell(cell, firstColumnLength))
      }

      addSeparator(result, [
        { from: 0, separator: FIRST_LINE_SEPARATOR + column[0] },
        { from: 1, separator: SEPARATOR + emptyCell },
        { from: rows + 1, separator: emptyCell },
      ])
      continue
    }

    if (colIndex > 0) {
      addSeparator(result, [
        { from: 0, separator: FIRST_LINE_SEPARATOR },
        { from: 1, separator: SEPARATOR },
      ])
    }

    const maxLength = Math.max(...column.map((cell) => cell.length))

    for (const cell of column) {
      result.push(normalizeCell(cell, maxLength))
    }
  }
  return result
}

const addSeparator = (result: string[], rules: { from: number; separator: string }[]) => {
  let ruleIndex = 0

  for (let i = 0; i < result.length; i++) {
    if (i >= rules[ruleIndex + 1]?.from) ruleIndex++
    const separator = rules[ruleIndex].separator
    result[i] += separator
  }
}

const isNeedWrap = (cells: string[][]): boolean[] => {
  const result: boolean[] = []
  for (let columnIndex = 0; columnIndex < cells.length; columnIndex++) {
    if (columnIndex == 0) {
      result.push(false)
      continue
    }

    const column = cells[columnIndex]

    const headerLength = column[0].length
    let isNeedWrap = false
    for (let i = 1; i < column.length; i++) {
      if (column[i].length > headerLength) {
        isNeedWrap = true
        break
      }
    }

    result.push(isNeedWrap)
  }
  return result
}

const normalizeCell = (cell: string, normalizedLength: number): string => {
  return cell + " ".repeat(normalizedLength - cell.length)
}
