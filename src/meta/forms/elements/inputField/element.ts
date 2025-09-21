import { inject, injectable } from "tsyringe"
import type { IInputField, IInputFieldProperties } from "./interfaces"
import type { IDataPathStrategy, INameStrategy } from "../../helpers/interfaces"
import { TYPES } from "../../container/symbols"
import { FormAttributeableMixin, FormNameableMixin } from "@/meta/forms/helpers/mixins"

@injectable({ token: TYPES.IInputField })
export class InputField extends FormAttributeableMixin(FormNameableMixin(class {})) implements IInputField {
  public value: string | boolean | number | Date = ""

  constructor(
    @inject(TYPES.IInputFieldProperties) public readonly properties: IInputFieldProperties,
    @inject(TYPES.IDataPathStrategy) private readonly _dataPathStrategy: IDataPathStrategy,
    @inject(TYPES.INameStrategy) private readonly _nameStrategy: INameStrategy
  ) {
    super()
  }
}
