import { injectable, container } from "tsyringe"
import {
  IInputFieldElement,
  ExplicitUndefined,

  IInputFieldElementProperties,
} from "../interfaces"
import { BaseFormElement, BaseFormElementProperties } from "@/meta/base/baseFormElement"
import { FormAttributeableMixin, FormAttributeablePropertiesMixin } from "../mixins/formAttributeableMixin"
import { FormNameableMixin } from "../mixins/formNameableMixin"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import { IDataPathNameStrategy } from "../mixins/interfaces"

const InputFieldElementBase = FormAttributeableMixin(FormNameableMixin(BaseFormElement))
const InputFieldElementPropertiesBase = FormAttributeablePropertiesMixin(BaseFormElementProperties))

@injectable()
export class InputFieldElementProperties extends InputFieldElementPropertiesBase implements IInputFieldElementProperties {
  public title: string = ""
  public height: number = 0
  public multiLine: boolean = false
  public choiceButton: boolean = false

  public horizontalAlignInGroup: SystemEnumeration.HorizontalAlign = SystemEnumeration.HorizontalAlign.Auto
  public horizontalStretch: ExplicitUndefined<boolean> = undefined

  constructor(dataPathNameStrategy: IDataPathNameStrategy) {
    super(dataPathNameStrategy)
  }
}

@injectable()
export class InputFieldElement extends InputFieldElementBase implements IInputFieldElement {
 
  constructor(dataPathNameStrategy: IDataPathNameStrategy, public properties: InputFieldElementProperties) {
    super()
  }
}
