import { IFormAttribute, IFormElement, IFormElementProperties } from "../interfaces"

export interface IFormNameable {
  get autoName(): string | undefined
  set autoName(value: string | undefined)

  get autoNameIndex(): number
  set autoNameIndex(value: number)
}

export interface IFormNameableProperties {
  get name(): string
  set name(value: string)
}

export interface IDataPathStrategy {
  get value(): string
  set value(value: string | undefined)

  get autoValue(): string
  set autoValue(value: string)

  get autoValueIndex(): number
  set autoValueIndex(value: number)

  get attibute(): IFormAttribute
}

export interface INameStrategy {
  get value(): string
  set value(value: string | undefined)

  get autoValue(): string
  set autoValue(value: string)

  get autoValueIndex(): number
  set autoValueIndex(value: number)
}

export interface IFormAttributeable {
  get autoDataPath(): string | undefined
  set autoDataPath(value: string | undefined)

  get autoDataPathIndex(): number
  set autoDataPathIndex(value: number)

  get attibute(): IFormAttribute

  // dataPathNameStrategy: IDataPathNameStrategy
}

export interface IFormAttributeableProperties {
  get dataPath(): string
  set dataPath(value: string)
}

export interface IFormItemable {
  items: IFormElement[]
  addItem(item: IFormElement): void
  removeItem(item: IFormElement): void
}

export interface IDefaultsProvider {
  render(element: IFormElement): Partial<IFormElementProperties>
}

export interface IDefaultsRule<IElement extends IFormElement, IProperties extends IFormElementProperties> {
  render(input: Partial<IProperties>, element: IElement): Partial<IProperties>
}
