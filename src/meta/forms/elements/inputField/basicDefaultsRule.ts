import { injectable } from "tsyringe"
import type { IDefaultsRule } from "../../helpers/interfaces"
import { TYPES } from "../../container/symbols"
import { IFormElementProperties } from "../../interfaces"
import { IFormElement } from "@/elements/interfaces"

@injectable({ token: TYPES.IBasicDefaultsRuleToken })
export class BasicDefaultsRule implements IDefaultsRule<IFormElement, IFormElementProperties> {
  render(result: Partial<IFormElementProperties>, _element: IFormElement): Partial<IFormElementProperties> {
    result.type = _element.properties.type
    return result
  }
}
