import { TBaseElement } from "../metadata/forms/elements/baseElement/types"
import {
  CheckFormatFunction,
  FormatFunction,
  IFormatElementResult,
  IFormatterParams,
  WrapInGroupStrategy,
} from "./types"
import { formatOtherElement } from "../metadata/forms/elements/baseElement/format"
import { ZElementType } from "../metadata/forms/elements/types"

type FormatRegistry = {
  format: FormatFunction<TBaseElement>
  check: CheckFormatFunction<TBaseElement>
}[]

const registry: FormatRegistry = []
const defaultParams = { wrapInGroup: WrapInGroupStrategy.Auto, level: 0, isFirst: true }

export const registerFormat = <T extends TBaseElement>(
  format: FormatFunction<T>,
  check: CheckFormatFunction<T>
): void => {
  registry.push({ format: format as FormatFunction<TBaseElement>, check: check as CheckFormatFunction<TBaseElement> })
}

export const formatElement = <T extends TBaseElement>(
  element: T,
  params: IFormatterParams = defaultParams
): IFormatElementResult => {
  params = { ...defaultParams, ...params }

  const formatter = registry.find((f) => f.check(element)) as FormatRegistry[number]
  if (!formatter) return formatOtherElement(element as unknown as TBaseElement, params)

  const result = formatter.format(element, params)
  return result
}

export const formatElements = (items: TBaseElement[]): IFormatElementResult => {
  let result: IFormatElementResult = { strings: [], haveSimpleHorizontalGroup: false }

  const separatedItems = [ZElementType.enum.Pages, ZElementType.enum.UsualGroup]

  let prevItem: TBaseElement | null = null
  for (const item of items) {
    if (prevItem && (separatedItems.includes(item.type) || separatedItems.includes(prevItem.type))) {
      result.strings.push("")
    }

    prevItem = item

    const text = formatElement(item, defaultParams)
    result.strings.push(...text.strings)
    result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || text.haveSimpleHorizontalGroup
  }
  return result
}

export const clearFormatRegistry = (): void => {
  registry.length = 0
}
