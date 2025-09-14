import { inject, injectable } from "tsyringe"
import { BaseFormElement, BaseFormElementProperties } from "@/meta/base/baseFormElement"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import { ExplicitUndefined, ICheckBoxFieldElement, ICheckBoxFieldElementProperties } from "../interfaces"
import {
  IDataPathNameStrategyToken,
  ICheckBoxFieldElementPropertiesToken,
  INameStrategyToken,
  ICheckBoxFieldElementToken,
} from "../container/containerConfig"
import type { IDataPathNameStrategy, INameStrategy } from "../mixins/interfaces"
import { FormAttributeableMixin, FormAttributeablePropertiesMixin } from "../mixins/formAttributeableMixin"
import { FormNameableMixin, FormNameablePropertiesMixin } from "../mixins/formNameableMixin"

@injectable({ token: ICheckBoxFieldElementPropertiesToken })
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
    @inject(IDataPathNameStrategyToken) private readonly dataPathNameStrategy: IDataPathNameStrategy,
    @inject(INameStrategyToken) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}

@injectable({ token: ICheckBoxFieldElementToken })
export class CheckBoxFieldElement
  extends FormAttributeableMixin(FormNameableMixin(BaseFormElement))
  implements ICheckBoxFieldElement
{
  public value: boolean = false

  constructor(
    @inject(ICheckBoxFieldElementPropertiesToken) public readonly properties: CheckBoxFieldElementProperties,
    @inject(IDataPathNameStrategyToken) private readonly dataPathNameStrategy: IDataPathNameStrategy,
    @inject(INameStrategyToken) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}
