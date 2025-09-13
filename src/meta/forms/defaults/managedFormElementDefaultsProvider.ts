import { injectable } from "tsyringe"
import { BaseDefaultsProvider } from "./baseDefaultsProvider"
import { IManagedFormElement } from "../interfaces"
import { ManagedFormElement } from "../elements/managedFormElement"

@injectable()
export class ManagedFormElementDefaultsProvider extends BaseDefaultsProvider<IManagedFormElement> {
  protected createDefaultElement(): IManagedFormElement {
    return new ManagedFormElement()
  }

  protected getFieldsToCheck(_element: IManagedFormElement, defaultElement: IManagedFormElement): string[] {
    return Object.keys(defaultElement.constructor.prototype) as (keyof IManagedFormElement)[]
  }

  protected applyAdditionalRules(_result: Partial<IManagedFormElement>, _element: IManagedFormElement): void {
    // Для ManagedFormElement дополнительных правил нет
  }
}
