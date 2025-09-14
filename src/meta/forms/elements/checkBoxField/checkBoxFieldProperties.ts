import { inject, injectable } from "tsyringe"
import { BaseFormElementProperties } from "@/meta/base/baseFormElement"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import { ExplicitUndefined, ICheckBoxFieldProperties } from "../../interfaces"
import { TYPES } from "../../container/symbols"
import type { IDataPathStrategy, INameStrategy } from "../../helpers/interfaces"
import { FormAttributeablePropertiesMixin } from "../../helpers/mixins/formAttributeableMixin"
import { FormNameablePropertiesMixin } from "../../helpers/mixins/formNameableMixin"

@injectable({ token: TYPES.ICheckBoxFieldProperties })
export class CheckBoxFieldProperties
  extends FormAttributeablePropertiesMixin(FormNameablePropertiesMixin(BaseFormElementProperties))
  implements ICheckBoxFieldProperties
{
  public title: string = ""
  public height: number = 0

  public horizontalAlignInGroup: SystemEnumeration.HorizontalAlign = SystemEnumeration.HorizontalAlign.Auto
  public horizontalStretch: ExplicitUndefined<boolean> = undefined

  public checkBoxType: SystemEnumeration.CheckBoxType = SystemEnumeration.CheckBoxType.Auto
  public titleLocation: SystemEnumeration.FormItemTitleLocation = SystemEnumeration.FormItemTitleLocation.Auto

  constructor(
    @inject(TYPES.IDataPathStrategy) private readonly dataPathStrategy: IDataPathStrategy,
    @inject(TYPES.INameStrategy) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}
