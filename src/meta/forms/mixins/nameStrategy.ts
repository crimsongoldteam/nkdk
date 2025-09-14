import { Lifecycle, registry } from "tsyringe"
import { INameStrategyToken } from "../container/containerConfig"
import { INameStrategy } from "./interfaces"

@registry([
  {
    token: INameStrategyToken,
    useClass: NameStrategy,
    options: { lifecycle: Lifecycle.ResolutionScoped },
  },
])
export class NameStrategy implements INameStrategy {
  private _value: string | undefined
  private _autoValue: string = ""
  private _autoValueIndex: number = 0

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
}
