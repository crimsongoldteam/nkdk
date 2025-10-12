import { CheckIsOneLineElementFunction } from "./types"
import { TElement } from "../metadata/forms/elements/element/types"
import { ElementType } from "../metadata/systemEnumerations/types"

const isOneLineElementCheckRegistry: Map<ElementType, CheckIsOneLineElementFunction> = new Map()

export const registerIsOneLineElementCheck = (type: ElementType, check: CheckIsOneLineElementFunction): void => {
  isOneLineElementCheckRegistry.set(type, check)
}

export const isOneLineElement = (element: TElement): boolean => {
  const checkFunction = isOneLineElementCheckRegistry.get(element.type)

  if (!checkFunction) return false

  return checkFunction(element)
}

export const clearIsOneLineElementCheckRegistry = (): void => {
  isOneLineElementCheckRegistry.clear()
}
