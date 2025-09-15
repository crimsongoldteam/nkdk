import { inject } from "tsyringe"
import { TYPES } from "../../container/symbols"
import type { IFormElementProperties } from "../../interfaces"
import type { IFormElement } from "@/elements/interfaces"
import type { IDefaultsProvider, IDefaultsRule } from "../interfaces"

export class DefaultsProvider implements IDefaultsProvider {
  constructor(
    @inject(TYPES.IDefaultsRuleToken) public readonly rule: IDefaultsRule<IFormElement, IFormElementProperties>,
    public readonly defaultElement: IFormElement
  ) {}

  render(element: IFormElement): Partial<IFormElementProperties> {
    const result = this.filter(element)
    return this.rule.render(result, element)
  }

  private filter(element: IFormElement): Partial<IFormElementProperties> {
    const result: Partial<IFormElementProperties> = {}

    for (const fieldName of Object.keys(this.defaultElement.properties) as (keyof IFormElementProperties)[]) {
      const defaultValue = this.defaultElement.properties[fieldName]
      if (typeof defaultValue === "object") {
        continue
      }

      const currentValue = element.properties[fieldName]

      if (currentValue !== defaultValue) {
        result[fieldName] = currentValue
      }
    }
    return result
  }
}
