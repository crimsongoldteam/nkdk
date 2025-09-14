import { inject, injectable } from "tsyringe"
import type { IInputFieldElement, IInputFieldElementProperties } from "../../interfaces"
import { BaseFormElement } from "@/meta/base/baseFormElement"
import type { IDataPathNameStrategy, INameStrategy } from "../../helpers/interfaces"
import {
  IDataPathNameStrategyToken,
  IInputFieldElementToken,
  IInputFieldElementPropertiesToken,
  INameStrategyToken,
} from "../../container/symbols"
import { FormAttributeableMixin, FormNameableMixin } from "@/meta/forms/helpers/mixins"

@injectable({ token: IInputFieldElementToken })
export class InputFieldElement
  extends FormAttributeableMixin(FormNameableMixin(BaseFormElement))
  implements IInputFieldElement
{
  public value: string | boolean | number | Date = ""

  constructor(
    @inject(IInputFieldElementPropertiesToken) public readonly properties: IInputFieldElementProperties,
    @inject(IDataPathNameStrategyToken) private readonly dataPathNameStrategy: IDataPathNameStrategy,
    @inject(INameStrategyToken) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}
