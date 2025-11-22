import * as yaml from "js-yaml"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { TAttribute } from "../types"
import { parseBoolean } from "~/lib/metadata/commonObjects/boolean/parse"

export default function parseAttributes(
  yamlContent: string,
  configurationSettings: TConfigurationSettings
): TAttribute[] {
  const parsed = yaml.load(yamlContent) as Record<string, any>
  const result: TAttribute[] = []

  for (const [name, data] of Object.entries(parsed)) {
    const attribute: TAttribute = {
      name,
      id: "",
    }

    if (data && typeof data === "object") {
      // Обработка Заголовок
      if ("Заголовок" in data) {
        const titleValue = data.Заголовок
        if (typeof titleValue === "string") {
          attribute.title = {
            items: {
              [configurationSettings.defaultLanguage]: titleValue,
            },
          }
        } else if (typeof titleValue === "object" && titleValue !== null) {
          attribute.title = {
            items: titleValue,
          }
        }
      }

      // Обработка Тип
      if ("Тип" in data && typeof data.Тип === "string") {
        attribute.type = parseTypeDescription(data.Тип)
      }

      // Обработка ОсновнойАтрибут
      if ("ОсновнойАтрибут" in data) {
        attribute.mainAttribute = parseBoolean(data.ОсновнойАтрибут)
      }

      // Обработка СохраняемыеДанные
      if ("СохраняемыеДанные" in data) {
        attribute.storedData = parseBoolean(data.СохраняемыеДанные)
      }

      // Обработка Использование (РазрешитьИспользование/ЗапретитьИспользование)
      if ("РазрешитьИспользование" in data) {
        attribute.use = parseUserVisible(data.РазрешитьИспользование, true)
      } else if ("ЗапретитьИспользование" in data) {
        attribute.use = parseUserVisible(data.ЗапретитьИспользование, false)
      }
    }

    result.push(attribute)
  }

  return result
}

function parseTypeDescription(typeString: string): any {
  // Базовые типы
  const typeMap: Record<string, string> = {
    Строка: "string",
    Число: "number",
    Дата: "date",
    Время: "date",
    ДатаВремя: "date",
  }

  // Простые типы
  if (typeString in typeMap) {
    const baseType = typeMap[typeString]
    const result: any = {
      type: [baseType],
    }

    if (typeString === "Время") {
      result.dateQualifiers = { dateFractions: "Time" }
    } else if (typeString === "ДатаВремя") {
      result.dateQualifiers = { dateFractions: "DateTime" }
    } else if (typeString === "Дата") {
      result.dateQualifiers = { dateFractions: "Date" }
    }

    return result
  }

  // Строка с параметрами: Строка(100) или ФиксированнаяСтрока(100)
  const stringMatch = typeString.match(
    /^(ФиксированнаяСтрока|Строка)\((\d+)\)$/
  )
  if (stringMatch) {
    const length = parseInt(stringMatch[2], 10)
    const allowedLength =
      stringMatch[1] === "ФиксированнаяСтрока" ? "Fixed" : "Variable"
    return {
      type: ["string"],
      stringQualifiers: {
        length,
        allowedLength,
      },
    }
  }

  // Число с параметрами: Число(10, 2) или НеотрицательноеЧисло(10, 2)
  const numberMatch = typeString.match(
    /^(НеотрицательноеЧисло|Число)\((\d+),\s*(\d+)\)$/
  )
  if (numberMatch) {
    const digits = parseInt(numberMatch[2], 10)
    const fractionDigits = parseInt(numberMatch[3], 10)
    const allowedSign =
      numberMatch[1] === "НеотрицательноеЧисло" ? "Nonnegative" : undefined
    return {
      type: ["number"],
      numberQualifiers: {
        digits,
        fractionDigits,
        ...(allowedSign && { allowedSign }),
      },
    }
  }

  // Множественные типы через запятую
  if (typeString.includes(", ")) {
    const types = typeString
      .split(", ")
      .map((t) => parseTypeDescription(t.trim()))
    if (types.length > 0) {
      const result: any = {
        type: [],
      }
      for (const typeDesc of types) {
        if (typeDesc && typeDesc.type) {
          result.type.push(...typeDesc.type)
          if (typeDesc.stringQualifiers) {
            result.stringQualifiers = typeDesc.stringQualifiers
          }
          if (typeDesc.numberQualifiers) {
            result.numberQualifiers = typeDesc.numberQualifiers
          }
          if (typeDesc.dateQualifiers) {
            result.dateQualifiers = typeDesc.dateQualifiers
          }
        }
      }
      return result
    }
  }

  // Если не удалось распарсить, возвращаем как есть
  return {
    type: [typeString],
  }
}

function parseUserVisible(
  values: Record<string, string> | undefined,
  common: boolean
): any {
  if (!values) return undefined

  const result = {
    common,
    values: [] as Array<{ name: string; value: boolean }>,
  }

  for (const [name, value] of Object.entries(values)) {
    const boolValue = parseBoolean(value)
    if (boolValue !== undefined) {
      result.values.push({ name, value: boolValue })
    }
  }

  return result.values.length > 0 ? result : undefined
}
