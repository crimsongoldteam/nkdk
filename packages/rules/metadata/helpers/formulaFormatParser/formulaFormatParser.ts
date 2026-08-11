import { FormulaFormatParserResult } from "./types"

function isWhitespace(char: string): boolean {
  return /\s/.test(char)
}

function addParameter(parameters: string[], formula: string, paramStart: number, paramEnd: number): void {
  if (paramStart === -1 || paramEnd <= paramStart) return
  const param = formula.substring(paramStart, paramEnd).trim()
  parameters.push(param)
}

export function formulaFormatParser(formula: string): FormulaFormatParserResult {
  const length = formula.length
  let i = 0

  // Пропускаем пробельные символы в начале
  while (i < length && isWhitespace(formula[i])) i++

  // Собираем название формулы и параметры за один проход
  const formulaStart = i
  let formulaEnd = i
  let bracketIndex = -1
  const parameters: string[] = []
  let paramStart = -1
  let paramEnd = -1

  while (i < length) {
    const char = formula[i]

    if (char === "(" && bracketIndex === -1) {
      bracketIndex = i
      i++
      continue
    }

    if (bracketIndex === -1) {
      // Собираем название формулы
      if (!isWhitespace(char)) formulaEnd = i + 1
      i++
      continue
    }

    // Собираем параметры
    if (char === ")") {
      addParameter(parameters, formula, paramStart, paramEnd)
      paramStart = -1
      break
    }

    if (char === ",") {
      addParameter(parameters, formula, paramStart, paramEnd)
      paramStart = -1
      paramEnd = -1
      i++
      continue
    }

    if (!isWhitespace(char)) {
      if (paramStart === -1) paramStart = i
      paramEnd = i + 1
    }

    i++
  }

  // Если скобка не закрыта, добавляем последний параметр
  if (bracketIndex !== -1) {
    addParameter(parameters, formula, paramStart, paramEnd)
  }

  return {
    formula: formula.substring(formulaStart, formulaEnd).trim(),
    parameters,
  }
}
