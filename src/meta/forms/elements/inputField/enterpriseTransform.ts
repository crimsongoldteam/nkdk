import { Expose, Type } from "class-transformer"
import { IInputField, type IInputFieldPropertiesPartial } from "./interfaces"
import type { IDefaultsProvider } from "../../helpers/interfaces"
import { inject, injectable } from "tsyringe"
import { TYPES } from "../../container/symbols"
import type { IEnterpriseTransform, IFormElementProperties, IPropertiesEnterpriseTransform } from "../../interfaces"
import * as SystemEnumeration from "@/meta/systemEnumerations"

@injectable({ token: TYPES.InputFieldPropertiesEnterpriseTransform })
export class InputFieldPropertiesEnterpriseTransform implements IPropertiesEnterpriseTransform {
  @Expose({ name: "Маска" })
  public mask?: string

  @Expose({ name: "Заголовок" })
  public title?: string

  @Expose({ name: "Вид" })
  public type?: SystemEnumeration.FormFieldType

  @Expose({ name: "ПодсказкаВвода" })
  public inputHint?: string

  public import(properties: IInputFieldPropertiesPartial) {
    Object.assign(this, properties)
  }

  public export(properties: IFormElementProperties): void {
    Object.assign(properties, this)
  }
}

@injectable({ token: TYPES.InputFieldEnterpriseTransform })
export class InputFieldEnterpriseTransform implements IEnterpriseTransform {
  @Expose({ name: "Тип" })
  public readonly type: string = "ПолеФормы"

  @Expose({ name: "Значение" })
  public value?: string | boolean | number | Date

  @Expose({ name: "НаборСвойств", toPlainOnly: true })
  public get properties(): IPropertiesEnterpriseTransform {
    return this._properties
  }

  @Expose({ name: "НаборСвойств", toClassOnly: true })
  @Type(() => InputFieldPropertiesEnterpriseTransform)
  public set properties(properties: IPropertiesEnterpriseTransform) {
    this._properties = properties
  }

  constructor(
    @inject(TYPES.IInputFieldEnterpriseDefaultsProvider) private readonly _provider: IDefaultsProvider,
    @inject(TYPES.InputFieldPropertiesEnterpriseTransform) private _properties: IPropertiesEnterpriseTransform
  ) {}

  public import(element: IInputField) {
    const changedProperties = this._provider.render(element)
    this._properties.import(changedProperties)
    this.value = element.value
  }

  public export(element: IInputField) {
    this._properties.export(element.properties)
    if (this.value !== undefined) {
      element.value = this.value
    }
  }
}
