import { CheckboxElement } from "../elements/checkboxElement"
import { FormatterFactory } from "./formatterFactory"
import { FormatterUtils } from "./helpers/formatterUtils"
import { BaseFormatter } from "./baseFormatter"
import { BaseElementMatcherStrategy } from "./matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "./indentation/conditionWrapInGroupStrategy"
import { PropertiesFormatter } from "./propertiesFormatter"

export class CheckboxFormatter extends BaseFormatter<CheckboxElement> {
  public format(element: CheckboxElement): string[] {
    let excludeProperties = ["Заголовок", "ГоризонтальноеПоложениеВГруппе", "ПоложениеЗаголовка", "ВидФлажка"]

    FormatterUtils.excludeStretchProperties(excludeProperties, element)

    const properties = PropertiesFormatter.render(element, { excludeProperties })

    let header = element.properties.title

    let result = FormatterUtils.getAlignmentAtLeft(element)

    result += FormatterUtils.getCheckboxString(
      header,
      true,
      element.getProperty("ВидФлажка") as string,
      element.value,
      element.getProperty("ПоложениеЗаголовка") as string
    )

    result += properties.join("")
    result += FormatterUtils.getAlignmentAtRight(element)

    return [result]
  }
}

FormatterFactory.register(
  new CheckboxFormatter(new BaseElementMatcherStrategy(CheckboxElement), new ConditionWrapInGroupStrategy())
)
