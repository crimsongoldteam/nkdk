import { inject, injectable } from "tsyringe"
import { BaseFormElement } from "@/meta/base/baseFormElement"
import type { ICheckBoxField, ICheckBoxFieldProperties } from "./interfaces"
import { TYPES } from "../../container/symbols"
import type { IDataPathStrategy, INameStrategy } from "../../helpers/interfaces"
import { FormAttributeableMixin } from "../../helpers/mixins/formAttributeableMixin"
import { FormNameableMixin } from "../../helpers/mixins/formNameableMixin"

@injectable({ token: TYPES.ICheckBoxField })
export class CheckBoxField
  extends FormAttributeableMixin(FormNameableMixin(BaseFormElement))
  implements ICheckBoxField
{
  public value: boolean = false

  constructor(
    @inject(TYPES.ICheckBoxFieldProperties) public readonly properties: ICheckBoxFieldProperties,
    @inject(TYPES.IDataPathStrategy) private readonly dataPathStrategy: IDataPathStrategy,
    @inject(TYPES.INameStrategy) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}
