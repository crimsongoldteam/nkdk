import { inject, injectable } from "tsyringe"
import type { IInputField, IInputFieldProperties } from "../../interfaces"
import { BaseFormElement } from "@/meta/base/baseFormElement"
import type { IDataPathStrategy, INameStrategy } from "../../helpers/interfaces"
import { TYPES } from "../../container/symbols"
import { FormAttributeableMixin, FormNameableMixin } from "@/meta/forms/helpers/mixins"

@injectable({ token: TYPES.IInputField })
export class InputField extends FormAttributeableMixin(FormNameableMixin(BaseFormElement)) implements IInputField {
  public value: string | boolean | number | Date = ""

  constructor(
    @inject(TYPES.IInputFieldElementProperties) public readonly properties: IInputFieldProperties,
    @inject(TYPES.IDataPathStrategy) private readonly dataPathStrategy: IDataPathStrategy,
    @inject(TYPES.INameStrategy) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}
