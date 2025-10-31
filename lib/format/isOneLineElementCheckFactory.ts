import { CheckIsOneLineElementFunction } from "./types"
import { TBaseElement } from "../metadata/forms/elements/baseElement/types"
import { TElementType } from "../metadata/forms/elements/types"

const isOneLineElementCheckRegistry: Map<TElementType, CheckIsOneLineElementFunction<TBaseElement>> = new Map()

export const registerIsOneLineElementCheck = <T extends TBaseElement>(
  type: TElementType,
  check: CheckIsOneLineElementFunction<T>
): void => {
  isOneLineElementCheckRegistry.set(type, check as CheckIsOneLineElementFunction<TBaseElement>)
}

export const isOneLineElement = <T extends TBaseElement>(element: T): boolean => {
  const checkFunction = isOneLineElementCheckRegistry.get(element.elementType)

  if (!checkFunction) return true

  return checkFunction(element)
}

export const clearIsOneLineElementCheckRegistry = (): void => {
  isOneLineElementCheckRegistry.clear()
}
