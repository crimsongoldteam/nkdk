import { container, inject, injectable, Lifecycle } from "tsyringe"
import { IInputField, ExplicitUndefined, IInputFieldProperties } from "../interfaces"
import { BaseFormElement, BaseFormElementProperties } from "@/meta/base/baseFormElement"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import type { IDataPathStrategy, IDefaultsRule, INameStrategy } from "../helpers/interfaces"
import {
  IDataPathNameStrategyToken,
  IInputFieldDefaultsRuleToken,
  IInputFieldDefaultsProviderToken,
  IInputFieldElementPropertiesToken,
  IInputFieldElementToken,
  INameStrategyToken,
} from "../container/symbols"
import { FormAttributeableMixin, FormAttributeablePropertiesMixin } from "../helpers/mixins/formAttributeableMixin"
import { FormNameableMixin, FormNameablePropertiesMixin } from "../helpers/mixins/formNameableMixin"
import { DefaultsProvider } from "../helpers/defaults/defaultsProvider"

@injectable({ token: IInputFieldElementPropertiesToken })
export class InputFieldElementProperties
  extends FormNameablePropertiesMixin(FormAttributeablePropertiesMixin(BaseFormElement))
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
    @inject(IDataPathNameStrategyToken) private readonly dataPathNameStrategy: IDataPathStrategy,
    @inject(INameStrategyToken) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}

@injectable({ token: IInputFieldElementToken })
export class InputFieldElement extends InputFieldElementBase implements IInputField {
  public value: string | boolean | number | Date = ""

  constructor(
    @inject(IInputFieldElementPropertiesToken) public readonly properties: InputFieldElementProperties,
    @inject(IDataPathNameStrategyToken) private readonly dataPathNameStrategy: IDataPathStrategy,
    @inject(INameStrategyToken) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}
@injectable({ token: IInputFieldDefaultsRuleToken })
export class InputFieldElementFormattingDefaultsRule implements IDefaultsRule<IInputField, IInputFieldProperties> {
  render(result: Partial<IInputFieldProperties>, element: IInputField): Partial<IInputFieldProperties> {
    delete result.choiceButton

    if (element.properties.multiLine && element.properties.height > 1) {
      delete result.multiLine
      delete result.height
    }

    return result
  }
}

container.register(
  IInputFieldDefaultsProviderToken,
  {
    useFactory: (dependencyContainer: DependencyContainer) => {
      const rule =
        dependencyContainer.resolve<IDefaultsRule<IInputField, IInputFieldProperties>>(IInputFieldDefaultsRuleToken)
      const defaultElement = dependencyContainer.resolve<IInputField>(IInputFieldElementToken)
      return new DefaultsProvider(rule, defaultElement)
    },
  },
  { lifecycle: Lifecycle.Singleton }
)
