import { injectable } from "tsyringe"
import { IManagedFormElement } from "../interfaces"
import { BaseFormElement } from "@/meta/base/baseFormElement"
import { FormNameableMixin } from "../helpers/mixins/formNameableMixin"
import { FormItemableMixin } from "../helpers/mixins/formItemableMixin"

const ManagedFormElementBase = FormItemableMixin(FormNameableMixin(BaseFormElement))

@injectable()
export class ManagedFormElement extends ManagedFormElementBase implements IManagedFormElement {
  public title: string = ""
}
