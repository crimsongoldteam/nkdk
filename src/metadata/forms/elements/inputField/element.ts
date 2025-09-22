import { inject, injectable } from "tsyringe"
import type { IInputField, IInputFieldProperties } from "./interfaces"
import { Expose, Type } from "class-transformer"
import { InputFieldProperties } from "./properties"
import { DITokens } from "@/symbols"

@injectable({ token: DITokens.InputField.Element })
export class InputField implements IInputField {
  @Expose({ name: "Тип" })
  public readonly type: string = "ПолеФормы"

  @Expose({ name: "Значение" })
  public value: string | boolean | number | Date = ""

  @Expose({ name: "НаборСвойств" })
  @Type(() => InputFieldProperties)
  public get properties(): IInputFieldProperties {
    return this._properties
  }

  public get XMLTransformToken(): symbol {
    return DITokens.InputField.XMLTransform
  }

  public get formatterToken(): symbol {
    return DITokens.InputField.Formatter
  }

  constructor(@inject(DITokens.InputField.Properties) public _properties: InputFieldProperties) {}

  public isMultiline(): boolean {
    return (this._properties.multiLine ?? false) && (this._properties.height ?? 0) > 1
  }
}
