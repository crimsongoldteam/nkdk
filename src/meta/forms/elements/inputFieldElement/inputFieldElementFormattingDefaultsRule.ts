import { injectable } from "tsyringe"
import { IInputFieldElement, IInputFieldElementProperties } from "../../interfaces"
import type { IDefaultsRule } from "../../helpers/interfaces"
import { TYPES } from "../../container/symbols"

@injectable({ token: TYPES.IInputFieldDefaultsRule })
export class InputFieldElementFormattingDefaultsRule
  implements IDefaultsRule<IInputFieldElement, IInputFieldElementProperties>
{
  render(
    result: Partial<IInputFieldElementProperties>,
    element: IInputFieldElement
  ): Partial<IInputFieldElementProperties> {
    delete result.title
    delete result.choiceButton

    if (element.properties.multiLine && element.properties.height > 1) {
      delete result.multiLine
      delete result.height
    }

    return result
  }
}
