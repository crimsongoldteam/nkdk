import { injectable } from "tsyringe"
import { ICheckBoxFieldElementProperties, ICheckBoxFieldElement } from "../../interfaces"
import type { IDefaultsRule } from "../../helpers/interfaces"
import { TYPES } from "../../container/symbols"

@injectable({ token: TYPES.ICheckBoxFieldDefaultsRule })
export class CheckBoxFieldElementFormattingDefaultsRule
  implements IDefaultsRule<ICheckBoxFieldElement, ICheckBoxFieldElementProperties>
{
  render(
    result: Partial<ICheckBoxFieldElementProperties>,
    element: ICheckBoxFieldElement
  ): Partial<ICheckBoxFieldElementProperties> {
    delete result.title

    // "Заголовок", "ГоризонтальноеПоложениеВГруппе", "ПоложениеЗаголовка", "ВидФлажка"

    return result
  }
}
