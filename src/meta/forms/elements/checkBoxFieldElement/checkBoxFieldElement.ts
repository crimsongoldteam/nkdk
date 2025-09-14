import { inject, injectable } from "tsyringe"
import { BaseFormElement } from "@/meta/base/baseFormElement"
import type { ICheckBoxFieldElement, ICheckBoxFieldElementProperties } from "../../interfaces"
import { TYPES } from "../../container/symbols"
import type { IDataPathNameStrategy, INameStrategy } from "../../helpers/interfaces"
import { FormAttributeableMixin } from "../../helpers/mixins/formAttributeableMixin"
import { FormNameableMixin } from "../../helpers/mixins/formNameableMixin"

@injectable({ token: TYPES.ICheckBoxFieldElement })
export class CheckBoxFieldElement
  extends FormAttributeableMixin(FormNameableMixin(BaseFormElement))
  implements ICheckBoxFieldElement
{
  public value: boolean = false

  constructor(
    @inject(TYPES.ICheckBoxFieldElementProperties) public readonly properties: ICheckBoxFieldElementProperties,
    @inject(TYPES.IDataPathNameStrategy) private readonly dataPathNameStrategy: IDataPathNameStrategy,
    @inject(TYPES.INameStrategy) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}
