import { PagesElement } from "../../elements/pagesElement"
import { BaseElementMatcherStrategy } from "../matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "../indentation/conditionWrapInGroupStrategy"
import { FormatterFactory } from "../formatterFactory"
import { BaseFormatter } from "../baseFormatter"
import { IFormatterParams } from "../interfaces"
import { PropertiesFormatter } from "../propertiesFormatter"

export class PagesFormatter extends BaseFormatter<PagesElement> {
  public format(element: PagesElement, _params: IFormatterParams): string[] {
    const result: string[] = []

    const properties = PropertiesFormatter.renderInineProperties(element)

    if (properties.length > 0) {
      result.push(...properties)
    }

    for (const item of element.items) {
      const text = FormatterFactory.render(item)
      result.push(...text)
    }

    return result
  }
}

FormatterFactory.register(
  new PagesFormatter(new BaseElementMatcherStrategy(PagesElement), new ConditionWrapInGroupStrategy())
)
