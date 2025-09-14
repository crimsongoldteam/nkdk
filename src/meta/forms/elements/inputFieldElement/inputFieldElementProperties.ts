import { inject, injectable } from "tsyringe"
import type { IInputFieldElementProperties, ExplicitUndefined } from "../../interfaces"
import { BaseFormElementProperties } from "@/meta/base/baseFormElement"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import type { IDataPathNameStrategy, INameStrategy } from "../../helpers/interfaces"
import { TYPES } from "../../container/symbols"
import { FormAttributeablePropertiesMixin, FormNameablePropertiesMixin } from "../../helpers/mixins"

@injectable({ token: TYPES.IInputFieldElementProperties })
export class InputFieldElementProperties
  extends FormNameablePropertiesMixin(FormAttributeablePropertiesMixin(BaseFormElementProperties))
  implements IInputFieldElementProperties
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
    @inject(TYPES.IDataPathNameStrategy) private readonly dataPathNameStrategy: IDataPathNameStrategy,
    @inject(TYPES.INameStrategy) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}
