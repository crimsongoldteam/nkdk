import { inject, injectable } from "tsyringe"
import { IInputFieldElement, ExplicitUndefined, IInputFieldElementProperties, IFormAttribute } from "../interfaces"
import { BaseFormElement, BaseFormElementProperties } from "@/meta/base/baseFormElement"
import { FormAttributeableMixin, FormAttributeablePropertiesMixin } from "../mixins/formAttributeableMixin"
import { FormNameableMixin } from "../mixins/formNameableMixin"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import type { IDataPathNameStrategy } from "../mixins/interfaces"

// const InputFieldElementBase = FormAttributeableMixin(FormNameableMixin(BaseFormElement))
// const InputFieldElementPropertiesBase = FormAttributeablePropertiesMixin(BaseFormElementProperties)

@injectable()
export class InputFieldElementProperties extends BaseFormElementProperties implements IInputFieldElementProperties {
  public title: string = ""
  public height: number = 0
  public multiLine: boolean = false
  public choiceButton: boolean = false

  public horizontalAlignInGroup: SystemEnumeration.HorizontalAlign = SystemEnumeration.HorizontalAlign.Auto
  public horizontalStretch: ExplicitUndefined<boolean> = undefined

  constructor(@inject("IDataPathNameStrategy") public readonly dataPathNameStrategy: IDataPathNameStrategy) {
    super()
  }

  get dataPathName(): string {
    return this.dataPathNameStrategy.value
  }
  set dataPathName(value: string) {
    this.dataPathNameStrategy.value = value
  }
}

@injectable()
export class InputFieldElement extends BaseFormElement implements IInputFieldElement {
  constructor(
    @inject("IDataPathNameStrategy") public readonly dataPathNameStrategy: IDataPathNameStrategy,
    public properties: InputFieldElementProperties
  ) {
    super()
  }
  get name(): string {
    throw new Error("Method not implemented.")
  }
  set name(value: string) {
    throw new Error("Method not implemented.")
  }
  get autoName(): string | undefined {
    throw new Error("Method not implemented.")
  }
  set autoName(value: string | undefined) {
    throw new Error("Method not implemented.")
  }
  get autoNameIndex(): number {
    throw new Error("Method not implemented.")
  }
  set autoNameIndex(value: number) {
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
