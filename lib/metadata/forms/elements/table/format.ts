import {
  FormatElementFunction,
  IFormatElementResult,
  IFormatterParams,
} from "~/lib/format/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import * as t from "~/lib/parser/treeParser/lexer"
import { TBaseElement } from "../baseElement/types"
import { TColumnGroup } from "../columnGroup/types"
import { TInputField } from "../inputField/types"
import { ZElementType } from "../types"
import { TTable } from "./types"

const V_BAR = t.VBar.LABEL as string

const formatColumnName = (name: string): string => {
  // Добавляем пробел перед цифрой: "Колонка1" -> "Колонка 1"
  return name.replace(/(\D)(\d)/, "$1 $2")
}

const getColumnHeader = (element: TInputField | TColumnGroup): string => {
  if (element.elementType === ZElementType.enum.ColumnGroup) {
    const columnGroup = element as TColumnGroup
    // Используем title если есть, иначе name с форматированием
    const title = columnGroup.title?.items?.ru
    if (title) {
      return title
    }
    return formatColumnName(columnGroup.name)
  } else {
    const inputField = element as TInputField
    // Используем title если есть, иначе name с форматированием
    const title = inputField.title?.items?.ru
    if (title) {
      return title
    }
    return formatColumnName(inputField.name)
  }
}

const formatTableRow = (columns: (TInputField | TColumnGroup)[]): string => {
  const headers = columns.map((col) => getColumnHeader(col))
  return `${V_BAR} ${headers.join(` ${V_BAR} `)} ${V_BAR}`
}

export const formatTable: FormatElementFunction = (
  element: TTable,
  _params: IFormatterParams
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  if (!element.childItems || element.childItems.length === 0) {
    return result
  }

  // Обрабатываем горизонтальные группы
  const hasHorizontalGroup = element.childItems.some((item) => {
    if (!("elementType" in item)) return false
    const baseItem = item as unknown as TBaseElement
    return (
      baseItem.elementType === ZElementType.enum.ColumnGroup &&
      "group" in baseItem &&
      (baseItem as unknown as TColumnGroup).group ===
        SE.ZColumnsGroup.enum.Horizontal
    )
  })

  if (hasHorizontalGroup) {
    // Обрабатываем каждую группу или колонку
    for (const item of element.childItems) {
      if (!("elementType" in item)) continue
      const baseItem = item as unknown as TBaseElement
      if (baseItem.elementType === ZElementType.enum.ColumnGroup) {
        const columnGroup = baseItem as unknown as TColumnGroup
        if (columnGroup.group === SE.ZColumnsGroup.enum.Horizontal) {
          // Сначала получаем строку с колонками для вычисления ширины
          if (columnGroup.childItems && columnGroup.childItems.length > 0) {
            const columns = columnGroup.childItems
              .filter((child) => "elementType" in child)
              .map((child) => child as unknown as TBaseElement)
              .filter(
                (child) => child.elementType === ZElementType.enum.InputField
              )
              .map((child) => child as unknown as TInputField)
            if (columns.length > 0) {
              const row = formatTableRow(columns)
              const rowWithExtraBar = `${V_BAR}${row.substring(1)}` // Добавляем дополнительный | в начале

              // Вычисляем ширину содержимого строки с колонками (от первого | до предпоследнего |)
              // rowWithExtraBar имеет формат: "|| Колонка 1 | Колонка 2 |" (26 символов)
              // Заголовок группы должен быть: "| Группа 1 ... ||" (25 символов, на 1 короче)
              const lastBarIndex = rowWithExtraBar.lastIndexOf(V_BAR)
              const rowContentWidth = lastBarIndex - 1 // Ширина от позиции 1 до предпоследнего |

              // Формируем заголовок группы с выравниванием
              const groupName = getColumnHeader(columnGroup)
              // groupHeader должен иметь формат: "| Группа 1 ... ||"
              // Содержимое между первым | и предпоследним | должно быть rowContentWidth - 1
              // (чтобы общая длина была на 1 символ короче строки с колонками)
              const groupContentWidth = rowContentWidth - 1
              const groupNameWithSpaces = `${groupName}${" ".repeat(
                Math.max(0, groupContentWidth - groupName.length - 1)
              )}`
              const groupHeader = `${V_BAR} ${groupNameWithSpaces}${V_BAR}${V_BAR}`

              result.strings.push(groupHeader)
              result.strings.push(rowWithExtraBar)
            }
          }
        } else {
          // Вертикальная группа - каждая колонка в отдельной строке
          if (columnGroup.childItems && columnGroup.childItems.length > 0) {
            const columns = columnGroup.childItems
              .filter((child) => "elementType" in child)
              .map((child) => child as unknown as TBaseElement)
              .filter(
                (child) => child.elementType === ZElementType.enum.InputField
              )
              .map((child) => child as unknown as TInputField)
            // Форматируем каждую колонку в отдельную строку
            for (const column of columns) {
              result.strings.push(formatTableRow([column]))
            }
          }
        }
      } else if (baseItem.elementType === ZElementType.enum.InputField) {
        // Обычная колонка
        result.strings.push(
          formatTableRow([baseItem as unknown as TInputField])
        )
      }
    }
  } else {
    // Нет горизонтальных групп - проверяем наличие вертикальных групп
    const hasVerticalGroup = element.childItems.some((item) => {
      if (!("elementType" in item)) return false
      const baseItem = item as unknown as TBaseElement
      return (
        baseItem.elementType === ZElementType.enum.ColumnGroup &&
        "group" in baseItem &&
        (baseItem as unknown as TColumnGroup).group ===
          SE.ZColumnsGroup.enum.Vertical
      )
    })

    if (hasVerticalGroup) {
      // Есть вертикальные группы - обрабатываем каждую группу
      for (const item of element.childItems) {
        if (!("elementType" in item)) continue
        const baseItem = item as unknown as TBaseElement
        if (baseItem.elementType === ZElementType.enum.ColumnGroup) {
          const columnGroup = baseItem as unknown as TColumnGroup
          // Вертикальная группа - каждая колонка в отдельной строке
          if (columnGroup.childItems && columnGroup.childItems.length > 0) {
            const columns = columnGroup.childItems
              .filter((child) => "elementType" in child)
              .map((child) => child as unknown as TBaseElement)
              .filter(
                (child) => child.elementType === ZElementType.enum.InputField
              )
              .map((child) => child as unknown as TInputField)
            // Форматируем каждую колонку в отдельную строку
            for (const column of columns) {
              result.strings.push(formatTableRow([column]))
            }
          }
        } else if (baseItem.elementType === ZElementType.enum.InputField) {
          // Обычная колонка
          result.strings.push(
            formatTableRow([baseItem as unknown as TInputField])
          )
        }
      }
    } else {
      // Нет групп - просто форматируем все колонки в одну строку
      const columns = element.childItems
        .filter((item) => "elementType" in item)
        .map((item) => item as unknown as TBaseElement)
        .filter((item) => item.elementType === ZElementType.enum.InputField)
        .map((item) => item as unknown as TInputField)
      if (columns.length > 0) {
        result.strings.push(formatTableRow(columns))
      }
    }
  }

  return result
}
