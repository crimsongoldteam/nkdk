import { injectable } from "tsyringe"
import { BaseDefaultsProvider } from "./baseDefaultsProvider"
import { IInputFieldElement } from "../interfaces"
import { InputFieldElement } from "../elements/inputFieldElement"

@injectable()
export class InputFieldElementDefaultsProvider extends BaseDefaultsProvider<IInputFieldElement> {
  protected createDefaultElement(): IInputFieldElement {
    return new InputFieldElement()
  }

  protected getFieldsToCheck(_element: IInputFieldElement, defaultElement: IInputFieldElement): string[] {
    return Object.keys(defaultElement.constructor.prototype) as (keyof IInputFieldElement)[]
  }

  protected applyAdditionalRules(result: Partial<IInputFieldElement>, element: IInputFieldElement): void {
    // Удаляем choiceButton из результата
    delete result.choiceButton

    // Специальная логика для multiLine и height
    if (element.multiLine && element.height > 1) {
      delete result.multiLine
      delete result.height
    }
  }
}
