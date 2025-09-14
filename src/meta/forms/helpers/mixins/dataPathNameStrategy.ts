import { Lifecycle, registry } from "tsyringe"
import { TYPES } from "../../container/symbols"
import { IFormAttribute } from "../../interfaces"
import { IDataPathNameStrategy } from "../interfaces"

@registry([
  {
    token: TYPES.IDataPathNameStrategy,
    useClass: DataPathNameStrategy,
    options: { lifecycle: Lifecycle.ResolutionScoped },
  },
])
export class DataPathNameStrategy implements IDataPathNameStrategy {
  private _value: string | undefined
  private _autoValue: string = ""
  private _autoValueIndex: number = 0
  // private _attibute: IFormAttribute = { name: "" }

  set value(value: string) {
    this._value = value
  }
  get value(): string {
    if (this._value != undefined) return this._value

    const index = this._autoValueIndex == 0 ? "" : this._autoValueIndex
    return `${this._autoValue}${index}`
  }
  get autoValue(): string {
    return this._autoValue
  }
  set autoValue(value: string) {
    this._autoValue = value
  }

  get autoValueIndex(): number {
    return this._autoValueIndex
  }
  set autoValueIndex(value: number) {
    this._autoValueIndex = value
  }
  get attibute(): IFormAttribute {
    throw new Error("Method not implemented.")
  }
}
