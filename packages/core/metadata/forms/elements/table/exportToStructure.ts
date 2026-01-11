import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { FormatElementFunction, IFormatElementResult } from "~/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/collections/childItems/parser/tokenizer/lexer"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { ChildItem } from "../../collections/childItems/types"
import { BaseElement } from "../baseElement/types"
import { ColumnGroup } from "../columnGroup/types"
import { InputField } from "../inputField/types"
import { Table } from "./types"

const V_BAR = t.VBar.LABEL as string

const formatColumnName = (name: string): string => {
  // Добавляем пробел перед цифрой: "Колонка1" -> "Колонка 1"
  return name.replace(/(\D)(\d)/, "$1 $2")
}

const getColumnHeader = (element: InputField | ColumnGroup): string => {
  if (element.elementType === FormElementType.ColumnGroup) {
    const columnGroup = element as ColumnGroup
    // Используем title если есть, иначе name с форматированием
    const title = columnGroup.title?.items?.ru
    if (title) {
      return title
    }
    return formatColumnName(columnGroup.name ?? "")
  } else {
    const inputField = element as InputField
    // Используем title если есть, иначе name с форматированием
    const title = inputField.title?.items?.ru
    if (title) {
      return title
    }
    return formatColumnName(inputField.name ?? "")
  }
}

const formatTableRow = (columns: (InputField | ColumnGroup)[]): string => {
  const headers = columns.map((col) => getColumnHeader(col))
  return `${V_BAR} ${headers.join(` ${V_BAR} `)} ${V_BAR}`
}

export const exportTableToStructure: FormatElementFunction = (
  _context: ConfigurationContext,
  element: BaseElement
): IFormatElementResult => {
  const tableElement = element as Table
  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  if (!tableElement.childItems || tableElement.childItems.length === 0) {
    return result
  }

  // Обрабатываем горизонтальные группы
  const hasHorizontalGroup = tableElement.childItems.some((item: ChildItem) => {
    if (!("elementType" in item)) return false
    const baseItem = item as unknown as BaseElement
    return (
      baseItem.elementType === FormElementType.ColumnGroup &&
      "group" in baseItem &&
      (baseItem as unknown as ColumnGroup).group === "Horizontal"
    )
  })

  if (hasHorizontalGroup) {
    // Обрабатываем каждую группу или колонку
    for (const item of tableElement.childItems) {
      if (!("elementType" in item)) continue
      const baseItem = item as unknown as BaseElement
      if (baseItem.elementType === FormElementType.ColumnGroup) {
        const columnGroup = baseItem as unknown as ColumnGroup
        if (columnGroup.group === "Horizontal") {
          // Сначала получаем строку с колонками для вычисления ширины
          if (columnGroup.childItems && columnGroup.childItems.length > 0) {
            const columns = columnGroup.childItems
              .filter((child: ChildItem) => "elementType" in child)
              .map((child: ChildItem) => child as unknown as BaseElement)
              .filter((child: BaseElement) => child.elementType === FormElementType.InputField)
              .map((child: BaseElement) => child as unknown as InputField)
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
              .filter((child: ChildItem) => "elementType" in child)
              .map((child: ChildItem) => child as unknown as BaseElement)
              .filter((child: BaseElement) => child.elementType === FormElementType.InputField)
              .map((child: BaseElement) => child as unknown as InputField)
            // Форматируем каждую колонку в отдельную строку
            for (const column of columns) {
              result.strings.push(formatTableRow([column]))
            }
          }
        }
      } else if (baseItem.elementType === FormElementType.InputField) {
        // Обычная колонка
        result.strings.push(formatTableRow([baseItem as unknown as InputField]))
      }
    }
  } else {
    // Нет горизонтальных групп - проверяем наличие вертикальных групп
    const hasVerticalGroup = tableElement.childItems.some((item: ChildItem) => {
      if (!("elementType" in item)) return false
      const baseItem = item as unknown as BaseElement
      return (
        baseItem.elementType === FormElementType.ColumnGroup &&
        "group" in baseItem &&
        (baseItem as unknown as ColumnGroup).group === "Vertical"
      )
    })

    if (hasVerticalGroup) {
      // Есть вертикальные группы - обрабатываем каждую группу
      for (const item of tableElement.childItems) {
        if (!("elementType" in item)) continue
        const baseItem = item as unknown as BaseElement
        if (baseItem.elementType === FormElementType.ColumnGroup) {
          const columnGroup = baseItem as unknown as ColumnGroup
          // Вертикальная группа - каждая колонка в отдельной строке
          if (columnGroup.childItems && columnGroup.childItems.length > 0) {
            const columns = columnGroup.childItems
              .filter((child: ChildItem) => "elementType" in child)
              .map((child: ChildItem) => child as unknown as BaseElement)
              .filter((child: BaseElement) => child.elementType === FormElementType.InputField)
              .map((child: BaseElement) => child as unknown as InputField)
            // Форматируем каждую колонку в отдельную строку
            for (const column of columns) {
              result.strings.push(formatTableRow([column]))
            }
          }
        } else if (baseItem.elementType === FormElementType.InputField) {
          // Обычная колонка
          result.strings.push(formatTableRow([baseItem as unknown as InputField]))
        }
      }
    } else {
      // Нет групп - просто форматируем все колонки в одну строку
      const columns = tableElement.childItems
        .filter((item: ChildItem) => "elementType" in item)
        .map((item: ChildItem) => item as unknown as BaseElement)
        .filter((item: BaseElement) => item.elementType === FormElementType.InputField)
        .map((item: BaseElement) => item as unknown as InputField)
      if (columns.length > 0) {
        result.strings.push(formatTableRow(columns))
      }
    }
  }

  return result
}

registerIsOneLineElementCheck(FormElementType.Table, () => false)
registerMetadata("ExportToStructure", "Table", exportTableToStructure)
