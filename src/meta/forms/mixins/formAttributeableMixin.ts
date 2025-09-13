import { IFormAttribute } from "../interfaces"
import { FormAttributeable } from "./interfaces"

type Constructor = new (...args: any[]) => {}

export function FormAttributeableMixin<TBase extends Constructor>(Base: TBase) {
  return class extends Base implements FormAttributeable {
    public _dataPath: string = ""
    public _dataPathName: string = ""
    public _autoDataPathName: string | undefined
    public _autoDataPathNameIndex: number = 0
    public _attibute: IFormAttribute = { name: "" }

    get dataPath(): string {
      return this._dataPath
    }

    set dataPath(value: string) {
      this._dataPath = value
    }

    get dataPathName(): string {
      return this._dataPathName
    }

    set dataPathName(value: string) {
      this._dataPathName = value
    }

    get autoDataPathName(): string | undefined {
      return this._autoDataPathName
    }

    set autoDataPathName(value: string | undefined) {
      this._autoDataPathName = value
    }

    get autoDataPathNameIndex(): number {
      return this._autoDataPathNameIndex
    }

    set autoDataPathNameIndex(value: number) {
      this._autoDataPathNameIndex = value
    }

    get attibute(): IFormAttribute {
      return this._attibute
    }
  }
}
