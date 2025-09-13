import { IFormAttribute } from "../interfaces"
import { IFormAttributeable, IDataPathNameStrategy, IFormAttributeableProperties } from "./interfaces"
import { injectable } from "tsyringe"

type Constructor = new (...args: any[]) => {}

@injectable()
export class DataPathNameStrategy implements IDataPathNameStrategy {
  private _dataPathName: string = ""
  private _autoValue: string | undefined
  private _autoValueIndex: number = 0
  // private _attibute: IFormAttribute = { name: "" }

  set value(value: string) {
    this._dataPathName = value
  }
  get value(): string {
    return this._dataPathName
  }
  get autoValue(): string | undefined {
    return this._autoValue
  }
  set autoValue(value: string | undefined) {
    this._autoValue = value
  }
  get autoDataPathNameIndex(): number {
    return this._autoValueIndex
  }
  set autoDataPathNameIndex(value: number) {
    this._autoValueIndex = value
  }
  get attibute(): IFormAttribute {
    throw new Error("Method not implemented.")
  }
}

export function FormAttributeableMixin<TBase extends Constructor>(Base: TBase) {
  return class extends Base implements IFormAttributeable {
    constructor(...args: any[]) {
      super(...args)
      this.dataPathNameStrategy = args[0]
    }
    private readonly dataPathNameStrategy: IDataPathNameStrategy

    get attibute(): IFormAttribute {
      return this.dataPathNameStrategy.attibute
    }
    get autoDataPathName(): string | undefined {
      return this.dataPathNameStrategy.autoValue
    }
    set autoDataPathName(value: string | undefined) {
      this.dataPathNameStrategy.autoValue = value
    }
    get autoDataPathIndex(): number {
      return this.dataPathNameStrategy.autoDataPathNameIndex
    }
    set autoDataPathIndex(value: number) {
      this.dataPathNameStrategy.autoDataPathNameIndex = value
    }
  }
}

export function FormAttributeablePropertiesMixin<TBase extends Constructor>(Base: TBase) {
  return class extends Base implements IFormAttributeableProperties {
    private readonly dataPathNameStrategy: IDataPathNameStrategy
    constructor(...args: any[]) {
      super(...args)
      this.dataPathNameStrategy = args[0]
    }

    get dataPathName(): string {
      return this.dataPathNameStrategy.value
    }
    set dataPathName(value: string) {
      this.dataPathNameStrategy.value = value
    }
  }
}
