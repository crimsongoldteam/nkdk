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
import { IDataPathNameStrategy, INameStrategy } from "../mixins/interfaces"
import { FormAttributeableMixin } from "../mixins/formAttributeableMixin"
import { FormNameableMixin } from "../mixins/formNameableMixin"

@injectable({ token: ICheckBoxFieldElementPropertiesToken })
export class CheckBoxFieldElementProperties
  extends BaseFormElementProperties
  implements ICheckBoxFieldElementProperties
{
  public title: string = ""
  public height: number = 0

  public horizontalAlignInGroup: SystemEnumeration.HorizontalAlign = SystemEnumeration.HorizontalAlign.Auto
  public horizontalStretch: ExplicitUndefined<boolean> = undefined

  /**
   * Конструктор класса CheckBoxFieldElementProperties.
   * @param dataPathNameStrategy - стратегия для генерации имени пути данных.
   * @param nameStrategy - стратегия для генерации имени элемента.
   */
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
  constructor(
    @inject(ICheckBoxFieldElementPropertiesToken) public readonly properties: CheckBoxFieldElementProperties,
    @inject(IDataPathNameStrategyToken) private readonly dataPathNameStrategy: IDataPathNameStrategy,
    @inject(INameStrategyToken) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}
