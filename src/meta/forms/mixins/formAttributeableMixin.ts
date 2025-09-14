import { IFormAttribute } from "../interfaces"
import { IFormAttributeable, IDataPathNameStrategy, IFormAttributeableProperties } from "./interfaces"

type Constructor = new (...args: any[]) => {}

export function FormAttributeableMixin<TBase extends Constructor>(Base: TBase) {
  return class extends Base implements IFormAttributeable {
    private getDataPathNameStrategy(): IDataPathNameStrategy {
      return (this as any).dataPathNameStrategy
    }

    get attibute(): IFormAttribute {
      return this.getDataPathNameStrategy().attibute
    }
    get autoDataPathName(): string {
      return this.getDataPathNameStrategy().autoValue
    }
    set autoDataPathName(value: string) {
      this.getDataPathNameStrategy().autoValue = value
    }
    get autoDataPathIndex(): number {
      return this.getDataPathNameStrategy().autoValueIndex
    }
    set autoDataPathIndex(value: number) {
      this.getDataPathNameStrategy().autoValueIndex = value
    }
  }
}

export function FormAttributeablePropertiesMixin<TBase extends Constructor>(Base: TBase) {
  return class FormAttributeablePropertiesMixin extends Base implements IFormAttributeableProperties {
    private getDataPathNameStrategy(): IDataPathNameStrategy {
      return (this as any).dataPathNameStrategy
    }

    get dataPathName(): string {
      return this.getDataPathNameStrategy().value
    }
    set dataPathName(value: string) {
      this.getDataPathNameStrategy().value = value
    }
  }
}
