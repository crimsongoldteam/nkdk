import { IBaseElement } from "@/elements/interfaces"
import { IFormElement } from "@/elements/interfaces"

export interface IFormatter<T extends IBaseElement> {
  canRender(element: IBaseElement, params: IFormatterParams): boolean
  format(element: T, params: IFormatterParams): string[]
  render(element: T, params: IFormatterParams): string[]
}

export interface IElementMatcherStrategy {
  canFormat(element: IFormElement, params: IFormatterParams): boolean
}

export interface IWrapInGroupStrategy {
  format(lines: string[], params: IFormatterParams): string[]
}

export enum WrapInGroupStrategy {
  None,
  Always,
  Auto,
}

export interface IFormatterParams {
  wrapInGroup?: WrapInGroupStrategy
  level?: number
  isFirst?: boolean
}
