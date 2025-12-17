import { CheckIsOneLineElementFunction } from "./types"
import { BaseElement } from "../metadata/forms/elements/baseElement/types"
import { FormElementType } from "../metadata/forms/elements/types"

const isOneLineElementCheckRegistry: Map<FormElementType, CheckIsOneLineElementFunction<BaseElement>> = new Map()

export const registerIsOneLineElementCheck = <T extends BaseElement>(
  type: FormElementType,
  check: CheckIsOneLineElementFunction<T>
): void => {
  isOneLineElementCheckRegistry.set(type, check as CheckIsOneLineElementFunction<BaseElement>)
}

export const isOneLineElement = <T extends BaseElement>(element: T): boolean => {
  const checkFunction = isOneLineElementCheckRegistry.get(element.elementType)

  if (!checkFunction) return false

  return checkFunction(element)
}

export const clearIsOneLineElementCheckRegistry = (): void => {
  isOneLineElementCheckRegistry.clear()
}
