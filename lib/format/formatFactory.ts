import { TElement } from "../metadata/forms/elements/element/types"
import { CheckFormatFunction, FormatFunction, IFormatterParams, WrapInGroupStrategy } from "./types"
import { formatOtherElement } from "../metadata/forms/elements/element/format"
import { TNamedElement } from "../metadata/forms/elements/element/types"

type FormatRegistry = {
  format: FormatFunction<TElement>
  check: CheckFormatFunction<TElement>
}[]

const registry: FormatRegistry = []
const defaultParams = { wrapInGroup: WrapInGroupStrategy.Auto, level: 0, isFirst: true }

export const registerFormat = <T extends TElement>(format: FormatFunction<T>, check: CheckFormatFunction<T>): void => {
  registry.push({ format: format as FormatFunction<TElement>, check: check as CheckFormatFunction<TElement> })
}

export const formatElement = <T extends TElement>(element: T, params: IFormatterParams = defaultParams): string[] => {
  params = { ...defaultParams, ...params }

  const formatter = registry.find((f) => f.check(element)) as FormatRegistry[number]
  if (!formatter) return formatOtherElement(element as unknown as TNamedElement, params)

  const result = formatter.format(element, params)
  return result
}

export const formatElements = (items: TElement[]): string[] => {
  const result: string[] = []

  for (const item of items) {
    const text = formatElement(item, defaultParams)
    result.push(...text)
  }
  return result
}

export const clearFormatRegistry = (): void => {
  registry.length = 0
}
