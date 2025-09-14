import { inject, injectable } from "tsyringe"
import { IInputFieldElement, ExplicitUndefined, IInputFieldElementProperties, IFormElementProperties } from "../interfaces"
import { BaseFormElement, BaseFormElementProperties } from "@/meta/base/baseFormElement"
import * as SystemEnumeration from "@/meta/systemEnumerations"
import type { IDataPathNameStrategy, INameStrategy } from "../mixins/interfaces"
import {
  IDataPathNameStrategyToken,
  IInputFieldElementPropertiesToken,
  IInputFieldElementToken,
  INameStrategyToken,
} from "../container/containerConfig"
import { FormAttributeableMixin, FormAttributeablePropertiesMixin } from "../mixins/formAttributeableMixin"
import { FormNameableMixin, FormNameablePropertiesMixin } from "../mixins/formNameableMixin"

const InputFieldElementBase = FormAttributeableMixin(FormNameableMixin(BaseFormElement))
const InputFieldElementPropertiesBase = FormAttributeablePropertiesMixin(
  FormNameablePropertiesMixin(BaseFormElementProperties)
)

@injectable({ token: IInputFieldElementPropertiesToken })
export class InputFieldElementProperties
  extends InputFieldElementPropertiesBase
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
    @inject(IDataPathNameStrategyToken) private readonly dataPathNameStrategy: IDataPathNameStrategy,
    @inject(INameStrategyToken) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}

@injectable({ token: IInputFieldElementToken })
export class InputFieldElement extends InputFieldElementBase implements IInputFieldElement {
  public value: string | boolean | number | Date = ""

  constructor(
    @inject(IInputFieldElementPropertiesToken) public readonly properties: InputFieldElementProperties,
    @inject(IDataPathNameStrategyToken) private readonly dataPathNameStrategy: IDataPathNameStrategy,
    @inject(INameStrategyToken) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
}

@injectable()
export class InputFieldElementFormattingDefaultsRules {
  protected apply(result: Partial<IInputFieldElementProperties>, element: IInputFieldElementProperties): void {
    delete result.choiceButton

    if (element.multiLine && element.height > 1) {
      delete result.multiLine
      delete result.height
    }
  }
}

interface IDefaultsProvider {
  render(element: IFormElement): <Partial<IFormElementProperties>>
}

interface IDefaultsRule {
  render(result: Partial<IFormElementProperties>, element: IFormElement): <Partial<IFormElementProperties>>
}

classs DefaultsProvider implements IDefaultsProvider {
  constructor(
    public readonly rule: IDefaultsRule
    public readonly defaultElement: IFormElement
  ) {}

  render(element: IFormElement): <Partial<IFormElementProperties>> {
    const result = this.filter(element)
    return this.rule.render(result, element)
  }

  private filter(element: IFormElement): <Partial<IFormElementProperties>> {
    const result: Partial<IFormElementProperties> = {}
    
    for (const fieldName of Object.keys(this.defaultElement.properties)) {
      const currentValue = (element.properties as any)[fieldName]
      const defaultValue = this.defaultProperties[fieldName]

      if (currentValue !== defaultValue) {
        ;(result as any)[fieldName] = currentValue
      }
    }
    return result
    }
  }

  
}


