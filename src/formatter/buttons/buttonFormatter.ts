import { ButtonElement } from "@/elements/index"
import { FormatterFactory } from "../formatterFactory"
import { BaseElementMatcherStrategy } from "../matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "../indentation/conditionWrapInGroupStrategy"
import { BaseFormatter } from "../baseFormatter"
import { getCaption } from "../helpers/buttonHelper"
import { PropertiesFormatter } from "../propertiesFormatter"

export class ButtonFormatter extends BaseFormatter<ButtonElement> {
  public format(element: ButtonElement): string[] {
    const excludeProperties = ["Заголовок", "Картинка", "ПоложениеКартинки"]

    const properties = PropertiesFormatter.render(element, { excludeProperties })

    const result = getCaption(element, true) + properties

    return [result]
  }
}

FormatterFactory.register(
  new ButtonFormatter(new BaseElementMatcherStrategy(ButtonElement), new ConditionWrapInGroupStrategy())
)
