import { injectable } from "tsyringe"
import { ICheckBoxFieldProperties, ICheckBoxField } from "./interfaces"
import type { IDefaultsRule } from "../../helpers/interfaces"
import { TYPES } from "../../container/symbols"

@injectable({ token: TYPES.ICheckBoxFieldFormatterDefaultsRule })
export class CheckBoxFieldFormatterDefaultsRule implements IDefaultsRule<ICheckBoxField, ICheckBoxFieldProperties> {
  render(result: Partial<ICheckBoxFieldProperties>, _element: ICheckBoxField): Partial<ICheckBoxFieldProperties> {
    delete result.title
    delete result.horizontalAlignInGroup
    delete result.titleLocation
    delete result.checkBoxType

    return result
  }
}
