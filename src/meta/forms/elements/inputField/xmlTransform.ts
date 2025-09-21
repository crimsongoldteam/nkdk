import { Expose, Type } from "class-transformer"
import { IInputField, type IInputFieldPropertiesPartial } from "./interfaces"
import type { IDefaultsProvider } from "../../helpers/interfaces"
import { inject, injectable } from "tsyringe"
import { TYPES } from "../../container/symbols"
import type { IXMLTransform } from "../../interfaces"
import { IFormElement } from "@/elements/interfaces"

@injectable({ token: TYPES.InputFieldXMLTransform })
export class InputFieldXMLTransform implements IXMLTransform {
  @Expose({ name: "Title" })
  public title?: string

  @Expose({ name: "@_name" })
  public name?: string

  constructor(@inject(TYPES.IInputFieldEnterpriseDefaultsProvider) private readonly _provider: IDefaultsProvider) {}

  import(element: IFormElement): void {
    const changedProperties = this._provider.render(element)
    Object.assign(this, changedProperties)
  }

  export(element: IInputField): void {
    Object.assign(element.properties, this)
  }
}
