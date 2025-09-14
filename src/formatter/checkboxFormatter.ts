import { FormatterFactory } from "./formatterFactory"
import { FormatterUtils } from "./helpers/formatterUtils"
import { BaseFormatter } from "./baseFormatter"
import { BaseElementMatcherStrategy } from "./matcher/baseElementMatcherStrategy"
import { ConditionWrapInGroupStrategy } from "./indentation/conditionWrapInGroupStrategy"
import { PropertiesFormatter } from "./propertiesFormatter"
import { ICheckBoxFieldElement } from "@/meta/forms/interfaces"

export class CheckboxFormatter extends BaseFormatter<ICheckBoxFieldElement> {
  public format(element: ICheckBoxFieldElement): string[] {
    // let excludeProperties = ["Заголовок", "ГоризонтальноеПоложениеВГруппе", "ПоложениеЗаголовка", "ВидФлажка"]

    // FormatterUtils.excludeStretchProperties(excludeProperties, element)

    const properties = PropertiesFormatter.render(element)

    let header = element.properties.title

    let result = FormatterUtils.getAlignmentAtLeft(element)

    result += FormatterUtils.getCheckboxString(
      header,
      true,
      element.properties.checkBoxType,
      element.value,
      element.properties.titleLocation
    )

    result += properties.join("")
    result += FormatterUtils.getAlignmentAtRight(element)

    return [result]
  }
}

// FormatterFactory.register(
//   new CheckboxFormatter(new BaseElementMatcherStrategy(CheckboxElement), new ConditionWrapInGroupStrategy())
// )
