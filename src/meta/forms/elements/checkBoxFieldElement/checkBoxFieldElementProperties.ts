import { inject, injectable } from "tsyringe"
import { BaseFormElementProperties } from "@/meta/base/baseFormElement"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import { ExplicitUndefined, ICheckBoxFieldElementProperties } from "../../interfaces"
import { TYPES } from "../../container/symbols"
import type { IDataPathNameStrategy, INameStrategy } from "../../helpers/interfaces"
import { FormAttributeablePropertiesMixin } from "../../helpers/mixins/formAttributeableMixin"
import { FormNameablePropertiesMixin } from "../../helpers/mixins/formNameableMixin"

@injectable({ token: TYPES.ICheckBoxFieldElementProperties })
export class CheckBoxFieldElementProperties
  extends FormAttributeablePropertiesMixin(FormNameablePropertiesMixin(BaseFormElementProperties))
  implements ICheckBoxFieldElementProperties
{
  public title: string = ""
  public height: number = 0

  public horizontalAlignInGroup: SystemEnumeration.HorizontalAlign = SystemEnumeration.HorizontalAlign.Auto
  public horizontalStretch: ExplicitUndefined<boolean> = undefined

  public checkBoxType: SystemEnumeration.CheckBoxType = SystemEnumeration.CheckBoxType.Auto
  public titleLocation: SystemEnumeration.FormItemTitleLocation = SystemEnumeration.FormItemTitleLocation.Auto

  constructor(
    @inject(TYPES.IDataPathNameStrategy) private readonly dataPathNameStrategy: IDataPathNameStrategy,
    @inject(TYPES.INameStrategy) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}
