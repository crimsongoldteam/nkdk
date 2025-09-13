import { ButtonElement } from "@/elements/index"
import { FormatterFactory } from "../formatterFactory"
import { ConditionWrapInGroupStrategy } from "../indentation/conditionWrapInGroupStrategy"
import { BaseFormatter } from "../baseFormatter"
import { getCaption } from "../helpers/buttonHelper"
import { PropertiesFormatter } from "../propertiesFormatter"
import { MenuMatcherStrategy } from "../matcher/menuMatcherStrategy"

export class MenuFormatter extends BaseFormatter<ButtonElement> {
  public format(element: ButtonElement): string[] {
    const excludeProperties = ["Заголовок", "Картинка", "ПоложениеКартинки"]

    const properties = PropertiesFormatter.render(element, { excludeProperties })

    const result = getCaption(element, true) + properties

    return [result]
  }
}

FormatterFactory.register(new MenuFormatter(new MenuMatcherStrategy(ButtonElement), new ConditionWrapInGroupStrategy()))
