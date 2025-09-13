import { injectable } from "tsyringe"
import { IInputFieldElement } from "../interfaces"
import { BaseFormElement } from "../../../base/baseFormElement"
import { FormAttributeableMixin } from "../mixins/formAttributeableMixin"
import { FormNameableMixin } from "../mixins/formNameableMixin"

const InputFieldElementBase = FormAttributeableMixin(FormNameableMixin(BaseFormElement))

@injectable()
export class InputFieldElement extends InputFieldElementBase implements IInputFieldElement {
  public height: number = 0
  public multiLine: boolean = false
  public choiceButton: boolean = false
}
