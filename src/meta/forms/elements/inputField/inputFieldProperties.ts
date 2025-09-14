import { inject, injectable } from "tsyringe"
import type { IInputFieldProperties, ExplicitUndefined } from "../../interfaces"
import { BaseFormElementProperties } from "@/meta/base/baseFormElement"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import type { IDataPathStrategy, INameStrategy } from "../../helpers/interfaces"
import { TYPES } from "../../container/symbols"
import { FormAttributeablePropertiesMixin, FormNameablePropertiesMixin } from "../../helpers/mixins"

@injectable({ token: TYPES.IInputFieldElementProperties })
export class InputFieldProperties
  extends FormNameablePropertiesMixin(FormAttributeablePropertiesMixin(BaseFormElementProperties))
  implements IInputFieldProperties
{
  public title: string = ""
  public height: number = 0
  public multiLine: boolean = false

  public choiceButton: boolean | undefined = undefined
  public dropListButton: boolean | undefined = undefined
  public сlearButton: boolean | undefined = undefined
  public openButton: boolean | undefined = undefined
  public spinButton: boolean | undefined = undefined

  public horizontalAlignInGroup: SystemEnumeration.HorizontalAlign = SystemEnumeration.HorizontalAlign.Auto
  public horizontalStretch: ExplicitUndefined<boolean> = undefined

  constructor(
    @inject(TYPES.IDataPathStrategy) private readonly dataPathStrategy: IDataPathStrategy,
    @inject(TYPES.INameStrategy) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}
