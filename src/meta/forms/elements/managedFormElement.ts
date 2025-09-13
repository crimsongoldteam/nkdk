import { injectable } from "tsyringe"
import { IManagedFormElement } from "../interfaces"
import { BaseFormElement } from "@/meta/base/baseFormElement"
import { FormNameableMixin } from "../mixins/formNameableMixin"
import { FormItemableMixin } from "../mixins/formItemableMixin"

const ManagedFormElementBase = FormItemableMixin(FormNameableMixin(BaseFormElement))

@injectable()
export class ManagedFormElement extends ManagedFormElementBase implements IManagedFormElement {
  public title: string = ""
}
