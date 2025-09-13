import { IFormAttribute, IFormElement } from "../interfaces"

export interface FormNameable {
  get name(): string
  set name(value: string)

  get autoName(): string | undefined
  set autoName(value: string | undefined)

  get autoNameIndex(): number
  set autoNameIndex(value: number)

  get isAutoName(): boolean
}

export interface IDataPathNameStrategy {
  get value(): string | undefined
  set value(value: string | undefined)

  get autoValue(): string
  set autoValue(value: string)

  get autoValueIndex(): number
  set autoValueIndex(value: number)

  get attibute(): IFormAttribute
}

export interface IFormAttributeable {
  get autoDataPathName(): string | undefined
  set autoDataPathName(value: string | undefined)

  get autoDataPathIndex(): number
  set autoDataPathIndex(value: number)

  get attibute(): IFormAttribute
}

export interface IFormAttributeableProperties {
  get dataPathName(): string
  set dataPathName(value: string)
}

export interface FormItemable {
  items: IFormElement[]
  addItem(item: IFormElement): void
  removeItem(item: IFormElement): void
}
