import * as t from "~/lib/parser/lexer"
const WRAP_THRESHOLD_MULTIPLIER = 2
const FIRST_LINE_SEPARATOR = " " + (t.Hash.LABEL as string)
const SEPARATOR = " " + "+"

export const mergeHorizontally = (...arrays: string[][]): string[] => {
  const isNeedWrapArray = isNeedWrap(arrays)

  let result: string[] = []
  for (let colIndex = 0; colIndex < arrays.length; colIndex++) {
    const column = arrays[colIndex]

    if (isNeedWrapArray[colIndex]) {
      result = addWrapColumn(result, column)
    } else {
      result = addColumn(result, column)
    }
  }
  return result
}

const addColumn = (current: string[], add: string[]): string[] => {
  let result: string[] = []

  const maxRows = Math.max(current.length, add.length)
  for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
    currentRow = current[rowIndex] ? current[rowIndex] : " ".repeat(current[0].length)
    result.push(current[rowIndex] + SEPARATOR)
  }
  result.push(...add)
  return result
}

const addWrapColumn = (current: string[], add: string[]): string[] => {
  let result: string[] = []

  for (let rowIndex = 0; rowIndex < current.length; rowIndex++) {
    if (rowIndex == 0) {
      result.push(current[rowIndex] + FIRST_LINE_SEPARATOR + add[0])
    } else {
      result.push(current[rowIndex] + SEPARATOR)
    }
  }

  result.push("-".repeat(current[0].length))
  result.push(...add.slice(1))

  return normalizeColumn(result)
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

const normalizeColumn = (column: string[]): string[] => {
  const maxLength = Math.max(...column.map((cell) => cell.length))
  return column.map((cell) => normalizeCell(cell, maxLength))
}
