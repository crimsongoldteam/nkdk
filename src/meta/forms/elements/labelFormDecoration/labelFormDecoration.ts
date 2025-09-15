import { inject, injectable } from "tsyringe"
import { BaseFormElement } from "@/meta/base/baseFormElement"
import type { IDataPathStrategy, INameStrategy } from "../../helpers/interfaces"
import { TYPES } from "../../container/symbols"
import { FormAttributeableMixin, FormNameableMixin } from "@/meta/forms/helpers/mixins"
import type { ILabelFormDecoration, ILabelFormDecorationProperties } from "./interfaces"

@injectable({ token: TYPES.ILabelFormDecoration })
export class LabelFormDecoration
  extends FormAttributeableMixin(FormNameableMixin(BaseFormElement))
  implements ILabelFormDecoration
{
  public value: string | boolean | number | Date = ""

  constructor(
    @inject(TYPES.ILabelFormDecorationProperties) public readonly properties: ILabelFormDecorationProperties,
    @inject(TYPES.IDataPathStrategy) private readonly dataPathStrategy: IDataPathStrategy,
    @inject(TYPES.INameStrategy) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}
