import { IFormNameable, IFormNameableProperties, INameStrategy } from "./interfaces"

type Constructor = new (...args: any[]) => {}

export function FormNameableMixin<TBase extends Constructor>(Base: TBase) {
  return class extends Base implements IFormNameable {
    private getNameStrategy(): INameStrategy {
      return (this as any).nameStrategy
    }

    get autoName(): string {
      return this.getNameStrategy().autoValue
    }
    set autoName(value: string) {
      this.getNameStrategy().autoValue = value
    }

    get autoNameIndex(): number {
      return this.getNameStrategy().autoValueIndex
    }

    set autoNameIndex(value: number) {
      this.getNameStrategy().autoValueIndex = value
    }
  }
}

export function FormNameablePropertiesMixin<TBase extends Constructor>(Base: TBase) {
  return class FormNameablePropertiesMixin extends Base implements IFormNameableProperties {
    private getNameStrategy(): INameStrategy {
      return (this as any).nameStrategy
    }

    get name(): string {
      return this.getNameStrategy().value
    }
    set name(value: string) {
      this.getNameStrategy().value = value
    }
  }
}
