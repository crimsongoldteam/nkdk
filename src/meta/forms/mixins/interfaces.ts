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

export interface FormAttributeable {
  get dataPath(): string
  set dataPath(value: string)

  get dataPathName(): string
  set dataPathName(value: string)

  get autoDataPathName(): string | undefined
  set autoDataPathName(value: string | undefined)

  get autoDataPathNameIndex(): number
  set autoDataPathNameIndex(value: number)

  get attibute(): IFormAttribute
}
export interface FormItemable {
  items: IFormElement[]
  addItem(item: IFormElement): void
  removeItem(item: IFormElement): void
}
