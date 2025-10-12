import { TElement } from "../metadata/forms/elements/element/types"
import { CheckFormatFunction, FormatFunction, IFormatterParams, WrapInGroupStrategy } from "./types"

type FormatRegistry<T extends TElement> = {
  format: FormatFunction<T>
  check: CheckFormatFunction<T>
}[]

const registry: FormatRegistry<TElement> = []
const defaultParams = { wrapInGroup: WrapInGroupStrategy.Auto, level: 0, isFirst: true }

export const registerFormat = <T extends TElement>(format: FormatFunction<T>, check: CheckFormatFunction<T>): void => {
  registry.push({ format, check })
}

export const formatElement = <T extends TElement>(element: T, params: IFormatterParams = defaultParams): string[] => {
  params = { ...defaultParams, ...params }

  const formatter = registry.find((f) => f.check(element as T))
  if (!formatter) throw new Error(`Formatter for ${element.type} not found`)

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
