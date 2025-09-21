import { injectable } from "tsyringe"
import { IInputField, IInputFieldProperties } from "./interfaces"
import type { IDefaultsRule } from "../../helpers/interfaces"
import { TYPES } from "../../container/symbols"

@injectable({ token: TYPES.IInputFieldFormatterDefaultsRule })
export class InputFieldElementFormatterDefaultsRule implements IDefaultsRule<IInputField, IInputFieldProperties> {
  render(result: Partial<IInputFieldProperties>, element: IInputField): Partial<IInputFieldProperties> {
    delete result.title
    delete result.choiceButton

    if (element.properties.multiLine && element.properties.height > 1) {
      delete result.multiLine
      delete result.height
    }

    return result
  }
}
