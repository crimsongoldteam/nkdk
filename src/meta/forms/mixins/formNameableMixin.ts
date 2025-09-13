import { FormNameable } from "./interfaces"

type Constructor = new (...args: any[]) => {}

export function FormNameableMixin<TBase extends Constructor>(Base: TBase) {
  return class extends Base implements FormNameable {
    public _name: string | undefined = undefined
    public _autoName: string = ""
    public _autoNameIndex: number = 0

    get name(): string {
      if (this._name !== undefined) return this._name

      const index = this._autoNameIndex == 0 ? "" : this._autoNameIndex
      return `${this._autoName}${index}`
    }

    set name(value: string | undefined) {
      this._name = value
    }

    get autoName(): string {
      return this._autoName
    }

    set autoName(value: string) {
      this._autoName = value ?? ""
    }

    get autoNameIndex(): number {
      return this._autoNameIndex
    }

    set autoNameIndex(value: number) {
      this._autoNameIndex = value
    }

    get isAutoName(): boolean {
      return this._name === undefined
    }
  }
}
