import { IFormAttribute } from "../../interfaces"
import { IFormAttributeable, IDataPathStrategy, IFormAttributeableProperties } from "../interfaces"

type Constructor = new (...args: any[]) => {}

export function FormAttributeableMixin<TBase extends Constructor>(Base: TBase) {
  return class extends Base implements IFormAttributeable {
    private getDataPathStrategy(): IDataPathStrategy {
      return (this as any).dataPathStrategy
    }

    get attibute(): IFormAttribute {
      return this.getDataPathStrategy().attibute
    }
    get autoDataPath(): string {
      return this.getDataPathStrategy().autoValue
    }
    set autoDataPath(value: string) {
      this.getDataPathStrategy().autoValue = value
    }
    get autoDataPathIndex(): number {
      return this.getDataPathStrategy().autoValueIndex
    }
    set autoDataPathIndex(value: number) {
      this.getDataPathStrategy().autoValueIndex = value
    }
  }
}

export function FormAttributeablePropertiesMixin<TBase extends Constructor>(Base: TBase) {
  return class FormAttributeablePropertiesMixin extends Base implements IFormAttributeableProperties {
    private getDataPathStrategy(): IDataPathStrategy {
      return (this as any).dataPathStrategy
    }

    get dataPath(): string {
      return this.getDataPathStrategy().value
    }
    set dataPath(value: string) {
      this.getDataPathStrategy().value = value
    }
  }
}
