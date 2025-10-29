import { CheckIsOneLineElementFunction } from "./types"
import { TBaseElement } from "../metadata/forms/elements/baseElement/types"
import { ElementType } from "../metadata/systemEnumerations/types"

const isOneLineElementCheckRegistry: Map<ElementType, CheckIsOneLineElementFunction<TBaseElement>> = new Map()

export const registerIsOneLineElementCheck = <T extends TBaseElement>(
  type: ElementType,
  check: CheckIsOneLineElementFunction<T>
): void => {
  isOneLineElementCheckRegistry.set(type, check as CheckIsOneLineElementFunction<TBaseElement>)
}

export const isOneLineElement = <T extends TBaseElement>(element: T): boolean => {
  const checkFunction = isOneLineElementCheckRegistry.get(element.type)

  if (!checkFunction) return true

  return checkFunction(element)
}

export const clearIsOneLineElementCheckRegistry = (): void => {
  isOneLineElementCheckRegistry.clear()
}
