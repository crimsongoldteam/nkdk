import { injectable } from "tsyringe"
import { IInputFieldElement, IInputFieldElementProperties } from "../../interfaces"
import type { IDefaultsRule } from "../../helpers/interfaces"
import { IInputFieldDefaultsRuleToken } from "../../container/symbols"

@injectable({ token: IInputFieldDefaultsRuleToken })
export class InputFieldElementFormattingDefaultsRule
  implements IDefaultsRule<IInputFieldElement, IInputFieldElementProperties>
{
  render(
    result: Partial<IInputFieldElementProperties>,
    element: IInputFieldElement
  ): Partial<IInputFieldElementProperties> {
    delete result.choiceButton

    if (element.properties.multiLine && element.properties.height > 1) {
      delete result.multiLine
      delete result.height
    }

    return result
  }
}
