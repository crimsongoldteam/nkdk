import { inject, injectable } from "tsyringe"
import type { IInputFieldElement, IInputFieldElementProperties } from "../../interfaces"
import { BaseFormElement } from "@/meta/base/baseFormElement"
import type { IDataPathNameStrategy, INameStrategy } from "../../helpers/interfaces"
import { TYPES } from "../../container/symbols"
import { FormAttributeableMixin, FormNameableMixin } from "@/meta/forms/helpers/mixins"

@injectable({ token: TYPES.IInputFieldElement })
export class InputFieldElement
  extends FormAttributeableMixin(FormNameableMixin(BaseFormElement))
  implements IInputFieldElement
{
  public value: string | boolean | number | Date = ""

  constructor(
    @inject(TYPES.IInputFieldElementProperties) public readonly properties: IInputFieldElementProperties,
    @inject(TYPES.IDataPathNameStrategy) private readonly dataPathNameStrategy: IDataPathNameStrategy,
    @inject(TYPES.INameStrategy) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}
