import { inject, injectable, Lifecycle, scoped } from "tsyringe"
import { IInputFieldElement, ExplicitUndefined, IInputFieldElementProperties, IFormAttribute } from "../interfaces"
import { BaseFormElement, BaseFormElementProperties } from "@/meta/base/baseFormElement"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import type { IDataPathNameStrategy } from "../mixins/interfaces"
import {
  IDataPathNameStrategyToken,
  IInputFieldElementPropertiesToken,
  IInputFieldElementToken,
} from "../container/containerConfig"

// const InputFieldElementBase = FormAttributeableMixin(FormNameableMixin(BaseFormElement))
// const InputFieldElementPropertiesBase = FormAttributeablePropertiesMixin(BaseFormElementProperties)

@injectable({ token: IInputFieldElementPropertiesToken })
export class InputFieldElementProperties extends BaseFormElementProperties implements IInputFieldElementProperties {
  public title: string = ""
  public height: number = 0
  public multiLine: boolean = false
  public choiceButton: boolean = false

  public horizontalAlignInGroup: SystemEnumeration.HorizontalAlign = SystemEnumeration.HorizontalAlign.Auto
  public horizontalStretch: ExplicitUndefined<boolean> = undefined

  constructor(@inject(IDataPathNameStrategyToken) public dataPathNameStrategy: IDataPathNameStrategy) {
    super()
  }

  get dataPathName(): string {
    return this.dataPathNameStrategy.value
  }
  set dataPathName(value: string) {
    this.dataPathNameStrategy.value = value
  }
}

@injectable({ token: IInputFieldElementToken })
export class InputFieldElement extends BaseFormElement implements IInputFieldElement {
  constructor(
    @inject(IInputFieldElementPropertiesToken) public properties: InputFieldElementProperties,
    @inject(IDataPathNameStrategyToken) public dataPathNameStrategy: IDataPathNameStrategy
  ) {
    super()
  }
  get name(): string {
    throw new Error("Method not implemented.")
  }
  set name(_value: string) {
    throw new Error("Method not implemented.")
  }
  get autoName(): string | undefined {
    throw new Error("Method not implemented.")
  }
  set autoName(_value: string | undefined) {
    throw new Error("Method not implemented.")
  }
  get autoNameIndex(): number {
    throw new Error("Method not implemented.")
  }
  set autoNameIndex(_value: number) {
    throw new Error("Method not implemented.")
  }
  get isAutoName(): boolean {
    throw new Error("Method not implemented.")
  }

  get attibute(): IFormAttribute {
    return this.dataPathNameStrategy.attibute
  }

  get autoDataPathName(): string {
    return this.dataPathNameStrategy.autoValue
  }
  set autoDataPathName(value: string) {
    this.dataPathNameStrategy.autoValue = value
  }
  get autoDataPathIndex(): number {
    return this.dataPathNameStrategy.autoValueIndex
  }
  set autoDataPathIndex(value: number) {
    this.dataPathNameStrategy.autoValueIndex = value
  }
}
