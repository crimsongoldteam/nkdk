import { CheckIsOneLineElementFunction } from "./types"
import { TElement } from "../metadata/forms/elements/element/types"
import { ElementType } from "../metadata/systemEnumerations/types"

const isOneLineElementCheckRegistry: Map<ElementType, CheckIsOneLineElementFunction<TElement>> = new Map()

export const registerIsOneLineElementCheck = <T extends TElement>(
  type: ElementType,
  check: CheckIsOneLineElementFunction<T>
): void => {
  isOneLineElementCheckRegistry.set(type, check as CheckIsOneLineElementFunction<TElement>)
}

export const isOneLineElement = <T extends TElement>(element: T): boolean => {
  const checkFunction = isOneLineElementCheckRegistry.get(element.type)

  if (!checkFunction) return true

  return checkFunction(element)
}

export const clearIsOneLineElementCheckRegistry = (): void => {
  isOneLineElementCheckRegistry.clear()
}
