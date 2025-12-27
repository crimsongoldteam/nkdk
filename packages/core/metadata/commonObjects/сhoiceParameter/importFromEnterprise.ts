import { Context } from "../../context/types"
import { importMetadataValueFromEnterprise } from "../metadataValue/importFromEnterprise"
import { MetadataFixedArrayValueEnterprise } from "../metadataValue/types"
import { ChoiceParameters, ChoiceParametersEnterprise } from "./types"

/**
 * Парсит строку вида "Отбор.ВАрхиве(Ложь), Отбор.Недействителен(Ложь)"
 * в массив ChoiceParameters
 */
const parseChoiceParametersString = (context: Context, value: string): ChoiceParameters => {
  const result: ChoiceParameters = []
  let currentIndex = 0

  while (currentIndex < value.length) {
    // Пропускаем пробелы и запятые
    while (currentIndex < value.length && (value[currentIndex] === " " || value[currentIndex] === ",")) {
      currentIndex++
    }
    if (currentIndex >= value.length) break

    // Извлекаем имя параметра (до открывающей скобки)
    const nameStart = currentIndex
    let nameEnd = currentIndex
    while (nameEnd < value.length && value[nameEnd] !== "(") {
      nameEnd++
    }
    if (nameEnd >= value.length) {
      throw new Error(`Invalid ChoiceParameters format: missing opening parenthesis at position ${currentIndex}`)
    }

    const name = value.slice(nameStart, nameEnd).trim()
    currentIndex = nameEnd + 1 // Пропускаем открывающую скобку

    // Извлекаем значение параметра (до закрывающей скобки)
    // Нужно учитывать вложенные скобки и кавычки
    let parenDepth = 1
    let valueStart = currentIndex
    let valueEnd = currentIndex
    let inQuotes = false

    while (currentIndex < value.length && parenDepth > 0) {
      const char = value[currentIndex]

      if (char === '"' && (currentIndex === 0 || value[currentIndex - 1] !== "\\")) {
        inQuotes = !inQuotes
      } else if (!inQuotes) {
        if (char === "(") {
          parenDepth++
        } else if (char === ")") {
          parenDepth--
          if (parenDepth === 0) {
            valueEnd = currentIndex
            break
          }
        }
      }
      currentIndex++
    }

    if (parenDepth > 0) {
      throw new Error(`Invalid ChoiceParameters format: unclosed parenthesis starting at position ${nameEnd}`)
    }

    const valueContent = value.slice(valueStart, valueEnd).trim()

    // Парсим значение
    // Если есть запятые (не внутри кавычек), то это fixedArray
    const parsedValue = parseValueContent(context, valueContent)

    result.push({
      name,
      value: parsedValue,
    })

    currentIndex++ // Пропускаем закрывающую скобку
  }

  return result
}

/**
 * Парсит содержимое значения параметра
 * Может быть одиночным значением или fixedArray (несколько значений через запятую)
 */
const parseValueContent = (context: Context, content: string): import("../metadataValue/types").MetadataValue => {
  // Проверяем, есть ли запятые не внутри кавычек
  const values = splitByCommaOutsideQuotes(content)

  if (values.length === 1) {
    // Одиночное значение
    const result = importMetadataValueFromEnterprise(context, values[0].trim())
    if (!result) {
      throw new Error(`Failed to parse value: ${values[0]}`)
    }
    return result
  }

  // FixedArray - несколько значений
  // importMetadataValueFromEnterprise может обработать массив строк
  const fixedArrayData: MetadataFixedArrayValueEnterprise = values
  const result = importMetadataValueFromEnterprise(context, fixedArrayData)
  if (!result) {
    throw new Error(`Failed to parse fixedArray values: ${values.join(", ")}`)
  }
  return result
}

/**
 * Разделяет строку по запятым, но не внутри кавычек
 */
const splitByCommaOutsideQuotes = (str: string): string[] => {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < str.length; i++) {
    const char = str[i]

    if (char === '"' && (i === 0 || str[i - 1] !== "\\")) {
      inQuotes = !inQuotes
      current += char
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  if (current.trim()) {
    result.push(current.trim())
  }

  return result
}

export const importChoiceParametersFromEnterprise = (
  context: Context,
  data: ChoiceParametersEnterprise | undefined
): ChoiceParameters | undefined => {
  if (!data) return undefined

  return parseChoiceParametersString(context, data)
}

