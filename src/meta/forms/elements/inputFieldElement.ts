import { injectable, container } from "tsyringe"
import { IInputFieldElement, ExplicitUndefined, IManagedFormElement } from "../interfaces"
import { BaseFormElement } from "@/meta/base/baseFormElement"
import { FormAttributeableMixin } from "../mixins/formAttributeableMixin"
import { FormNameableMixin } from "../mixins/formNameableMixin"
import { HorizontalAlign } from "@/meta/systemEnumerations"
import { DefaultsService } from "../defaults/defaultsService"

const InputFieldElementBase = FormAttributeableMixin(FormNameableMixin(BaseFormElement))

@injectable()
export class InputFieldElement extends InputFieldElementBase implements IInputFieldElement {
  public title: string = ""
  public horizontalAlignInGroup: HorizontalAlign = HorizontalAlign.Auto
  public horizontalStretch: ExplicitUndefined<boolean> = undefined
  public height: number = 0
  public multiLine: boolean = false
  public choiceButton: boolean = false

  public value: string | boolean | number | Date = ""
}
